import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../api/client.js';
import { renderWithQuery } from '../test/utils.jsx';
import FamilyPage from './FamilyPage.jsx';

vi.mock('../api/client.js', () => ({
  api: vi.fn(),
  toQuery: (p) => `?${new URLSearchParams(p)}`,
}));

const member = (id, name, extra = {}) => ({
  user_id: id,
  full_name: name,
  email: `${name.toLowerCase()}@x.com`,
  is_head: false,
  is_me: false,
  can_view: false,
  joined_at: '2026-10-01T10:00:00Z',
  ...extra,
});

const familyFor = (me) => ({
  family: { id: 'f1', name: 'The Shahs', members_can_view_all: false },
  is_head: me === 'head',
  members: [
    member('u-head', 'Papa', { is_head: true, is_me: me === 'head', can_view: true }),
    member('u-kid', 'Kid', { is_me: me === 'kid', can_view: true }),
  ],
  invites: [
    {
      id: 'i1',
      email: 'mom@x.com',
      invited_by: 'u-kid',
      invited_by_name: 'Kid',
      created_at: '2026-10-29T10:00:00Z',
    },
  ],
  received_invites: [],
});

let familyData;
beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path) =>
    path === '/family' ? { data: familyData } : { data: {} },
  );
});

const renderAt = (url) =>
  renderWithQuery(
    <MemoryRouter initialEntries={[url]}>
      <FamilyPage />
    </MemoryRouter>,
  );

describe('FamilyPage without a family', () => {
  beforeEach(() => {
    familyData = {
      family: null,
      is_head: false,
      members: [],
      invites: [],
      received_invites: [
        {
          id: 'inv-9',
          family_name: 'The Patels',
          invited_by_name: 'Asha',
          created_at: '2026-10-29T10:00:00Z',
        },
      ],
    };
  });

  it('asks for a name before creating, then creates', async () => {
    renderAt('/family');
    await userEvent.click(await screen.findByRole('button', { name: 'Create family' }));
    expect(await screen.findByText('Give your family a name')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Family name'), '  Shahs ');
    await userEvent.click(screen.getByRole('button', { name: 'Create family' }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/family', { method: 'POST', body: { name: 'Shahs' } }),
    );
  });

  it('accepts a received invite', async () => {
    renderAt('/family');
    expect(await screen.findByText('The Patels')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/family/invites/inv-9/accept', { method: 'POST' }),
    );
  });
});

describe('FamilyPage members tab', () => {
  it('a member sees no head controls and can leave', async () => {
    familyData = familyFor('kid');
    renderAt('/family?tab=members');

    expect(await screen.findByText('Papa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.getByText(/Only Papa can see each person’s spending/)).toBeInTheDocument();
    // the kid sent the invite, so the kid can cancel it
    expect(screen.getByRole('button', { name: 'Cancel invite to mom@x.com' })).toBeInTheDocument();

    const leave = screen.getByRole('button', { name: 'Leave The Shahs' });
    await userEvent.click(leave);
    expect(api).not.toHaveBeenCalledWith('/family/leave', expect.anything());
    await userEvent.click(screen.getByRole('button', { name: 'Confirm: Leave The Shahs' }));
    await waitFor(() => expect(api).toHaveBeenCalledWith('/family/leave', { method: 'POST' }));
  });

  it('the head removes a member with two taps and can open the view', async () => {
    familyData = familyFor('head');
    renderAt('/family?tab=members');

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Kid' }));
    expect(api).not.toHaveBeenCalledWith('/family/members/u-kid', expect.anything());
    await userEvent.click(screen.getByRole('button', { name: 'Confirm: Remove Kid' }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/family/members/u-kid', { method: 'DELETE' }),
    );

    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/family', {
        method: 'PUT',
        body: { members_can_view_all: true },
      }),
    );
  });

  it('invites by email and checks the format first', async () => {
    familyData = familyFor('kid');
    renderAt('/family?tab=members');

    const input = await screen.findByLabelText('Email');
    await userEvent.type(input, 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'aunt@x.com');
    await userEvent.click(screen.getByRole('button', { name: 'Invite' }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/family/invites', {
        method: 'POST',
        body: { email: 'aunt@x.com' },
      }),
    );
  });
});

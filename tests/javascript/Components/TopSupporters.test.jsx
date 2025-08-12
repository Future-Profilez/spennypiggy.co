import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import TopSupporters from '../../../resources/js/Pages/leaderboard/TopSupporters';

// Mock the components that TopSupporters uses
jest.mock('../../../resources/js/includes/Avatar', () => {
  return function MockAvatar({ name, username, role, profile_status_lock }) {
    return (
      <div data-testid="avatar" data-name={name} data-username={username}>
        Avatar: {name} (@{username}) - Role: {role} - Lock: {profile_status_lock}
      </div>
    );
  };
});

jest.mock('../../../resources/js/includes/LoadingScreen', () => {
  return function MockLoadingScreen() {
    return <div data-testid="loading-screen">Loading...</div>;
  };
});

jest.mock('../../../resources/js/includes/PriceFormat', () => {
  return function usePriceFormat() {
    return {
      formatMultiPrice: jest.fn((amount, currency) => `${amount} ${currency}`)
    };
  };
});

jest.mock('../../../resources/js/includes/Nocontent', () => {
  return function MockNocontent({ text, classes }) {
    return <div data-testid="no-content" className={classes}>{text}</div>;
  };
});

describe('TopSupporters Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSupportersData = [
    {
      uuid: 'supporter-1',
      name: 'John Supporter',
      username: 'johnsupporter',
      avatar_url: 'https://example.com/avatar1.jpg',
      role: 1,
      profile_status_lock: 2,
      gift_count: 150,
      support_types: ['wish_item', 'membership', 'bill']
    },
    {
      uuid: 'supporter-2',
      name: 'Jane Patron',
      username: 'janepatron',
      avatar_url: 'https://example.com/avatar2.jpg',
      role: 0,
      profile_status_lock: 1,
      gift_count: 95,
      support_types: ['wish_item', 'shop']
    },
    {
      uuid: 'supporter-3',
      name: 'Bob Gifter',
      username: 'bobgifter',
      avatar_url: 'https://example.com/avatar3.jpg',
      role: 0,
      profile_status_lock: 1,
      gift_count: 1,
      support_types: ['membership']
    }
  ];

  test('renders loading state initially', () => {
    // Mock axios to delay response
    axios.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<TopSupporters />);
    
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  test('displays supporters data correctly after loading', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    // Check title and description
    expect(screen.getByText('🏆 Top Supporters')).toBeInTheDocument();
    expect(screen.getByText('Most active supporters by gift count')).toBeInTheDocument();

    // Check that supporters are displayed with correct data
    expect(screen.getByText('John Supporter')).toBeInTheDocument();
    expect(screen.getByText('@johnsupporter')).toBeInTheDocument();
    expect(screen.getByText('150 gifts')).toBeInTheDocument();
    expect(screen.getByText('3 types')).toBeInTheDocument();

    expect(screen.getByText('Jane Patron')).toBeInTheDocument();
    expect(screen.getByText('@janepatron')).toBeInTheDocument();
    expect(screen.getByText('95 gifts')).toBeInTheDocument();
    expect(screen.getByText('2 types')).toBeInTheDocument();

    expect(screen.getByText('Bob Gifter')).toBeInTheDocument();
    expect(screen.getByText('@bobgifter')).toBeInTheDocument();
    expect(screen.getByText('1 gift')).toBeInTheDocument();
    expect(screen.getByText('1 type')).toBeInTheDocument();
  });

  test('displays supporters in correct order by gift count', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    const supporterElements = screen.getAllByText(/gifts?$/);
    
    // Should be ordered by gift count (descending)
    expect(supporterElements[0]).toHaveTextContent('150 gifts');
    expect(supporterElements[1]).toHaveTextContent('95 gifts');
    expect(supporterElements[2]).toHaveTextContent('1 gift');
  });

  test('displays rank badges correctly', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    // Check for index badges (1, 2, 3)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('handles singular vs plural gift/type text correctly', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    // Check singular for Bob Gifter (1 gift, 1 type)
    expect(screen.getByText('1 gift')).toBeInTheDocument();
    expect(screen.getByText('1 type')).toBeInTheDocument();

    // Check plural for others
    expect(screen.getByText('150 gifts')).toBeInTheDocument();
    expect(screen.getByText('3 types')).toBeInTheDocument();
    expect(screen.getByText('95 gifts')).toBeInTheDocument();
    expect(screen.getByText('2 types')).toBeInTheDocument();
  });

  test('displays no content message when no supporters', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: []
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('🏆 Top Supporters')).not.toBeInTheDocument();
  });

  test('handles API error with retry button', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load top supporters. Please try again.')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('John Supporter')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('fetches data from correct API endpoint', () => {
    render(<TopSupporters />);
    
    expect(axios.get).toHaveBeenCalledWith('top-supporters/frequency');
  });

  test('displays support type tooltips correctly', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    // Check tooltip content
    const tooltipElement = screen.getByTitle('Support types: wish_item, membership, bill');
    expect(tooltipElement).toBeInTheDocument();
  });

  test('uses social engagement metrics instead of monetary values', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    // Should show gift counts, not monetary amounts
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/EUR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GBP/)).not.toBeInTheDocument();
    
    // Should show gift counts
    expect(screen.getByText('150 gifts')).toBeInTheDocument();
    expect(screen.getByText('95 gifts')).toBeInTheDocument();
    expect(screen.getByText('1 gift')).toBeInTheDocument();
  });

  test('renders avatar with correct props for social metrics', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockSupportersData
      }
    });

    render(<TopSupporters />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    });

    const avatars = screen.getAllByTestId('avatar');
    
    expect(avatars[0]).toHaveAttribute('data-name', 'John Supporter');
    expect(avatars[0]).toHaveAttribute('data-username', 'johnsupporter');
    expect(avatars[1]).toHaveAttribute('data-name', 'Jane Patron');
    expect(avatars[1]).toHaveAttribute('data-username', 'janepatron');
  });
});

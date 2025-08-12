import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import GrowthTrends from '../../../resources/js/Pages/leaderboard/GrowthTrends';

// Mock the dependencies
jest.mock('react-icons/ri', () => ({
  RiArrowUpLine: () => <div data-testid="arrow-up-icon">↑</div>,
  RiArrowDownLine: () => <div data-testid="arrow-down-icon">↓</div>,
  RiPulseLine: () => <div data-testid="pulse-icon">~</div>
}));

jest.mock('../../../resources/js/includes/PriceFormat', () => {
  return function usePriceFormat() {
    return {
      formatMultiPrice: jest.fn((amount, currency) => `${amount} ${currency}`)
    };
  };
});

jest.mock('../../../resources/js/includes/Avatar', () => {
  return function MockAvatar({ name, username, role, profile_status_lock, size }) {
    return (
      <div data-testid="avatar" data-name={name} data-username={username} data-size={size}>
        Avatar: {name} (@{username})
      </div>
    );
  };
});

describe('GrowthTrends Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGrowthData = {
    fastest_growing: [
      {
        id: 1,
        name: 'Rising Star Creator',
        username: 'risingstar',
        avatar_url: 'avatar1.jpg',
        role: 1,
        profile_status_lock: 1,
        supporters: 1250,
        growth_percentage: 85.5,
        current_amount: null,
        currency: null
      },
      {
        id: 2,
        name: 'Momentum Creator',
        username: 'momentum',
        avatar_url: 'avatar2.jpg',
        role: 0,
        profile_status_lock: 1,
        supporters: 950,
        growth_percentage: 65.2,
        current_amount: null,
        currency: null
      }
    ],
    momentum_leaders: [
      {
        id: 3,
        name: 'Weekly Leader',
        username: 'weeklyleader',
        avatar_url: 'avatar3.jpg',
        role: 1,
        profile_status_lock: 2,
        supporters: 800,
        growth_percentage: 45.8,
        current_amount: null,
        currency: null
      }
    ],
    comeback_creators: [
      {
        id: 4,
        name: 'Comeback King',
        username: 'comebackking',
        avatar_url: 'avatar4.jpg',
        role: 0,
        profile_status_lock: 1,
        supporters: 600,
        growth_percentage: 125.3,
        current_amount: null,
        currency: null
      }
    ],
    platform_stats: {
      total_creators: 15420,
      creators_growth: 12.5,
      total_interactions: 89650,
      engagement_growth: 18.2,
      new_supporters: 3250,
      supporters_growth: 22.8,
      avg_community_score: 7.8,
      community_growth: 8.5,
      monthly_revenue: null, // Deprecated
      revenue_growth: null,  // Deprecated
      avg_support: null,     // Deprecated
      avg_growth: null       // Deprecated
    }
  };

  test('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<GrowthTrends />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays growth trends data correctly after loading', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check main title and description
    expect(screen.getByText('📈 Growth & Momentum')).toBeInTheDocument();
    expect(screen.getByText('Creators with the fastest growth and momentum')).toBeInTheDocument();

    // Check section titles
    expect(screen.getByText('🚀 Fastest Growing This Month')).toBeInTheDocument();
    expect(screen.getByText('⚡ Weekly Momentum Leaders')).toBeInTheDocument();
    expect(screen.getByText('🔄 Comeback Creators')).toBeInTheDocument();
  });

  test('displays platform stats with social engagement metrics', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check platform stats display social engagement instead of monetary values
    expect(screen.getByText('Total Active Creators')).toBeInTheDocument();
    expect(screen.getByText('15420')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();

    expect(screen.getByText('Community Engagement')).toBeInTheDocument();
    expect(screen.getByText('89650')).toBeInTheDocument(); // total_interactions
    expect(screen.getByText('+18.2%')).toBeInTheDocument();

    expect(screen.getByText('New Supporters')).toBeInTheDocument();
    expect(screen.getByText('3250')).toBeInTheDocument();
    expect(screen.getByText('+22.8%')).toBeInTheDocument();

    expect(screen.getByText('Avg. Community Score')).toBeInTheDocument();
    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getByText('+8.5%')).toBeInTheDocument();
  });

  test('displays fastest growing creators with supporter counts', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check fastest growing creators show supporter metrics
    expect(screen.getByText('Rising Star Creator')).toBeInTheDocument();
    expect(screen.getByText('@risingstar')).toBeInTheDocument();
    expect(screen.getByText('👥 1250')).toBeInTheDocument(); // supporters emoji + count
    expect(screen.getByText('+85.5% growth')).toBeInTheDocument();

    expect(screen.getByText('Momentum Creator')).toBeInTheDocument();
    expect(screen.getByText('@momentum')).toBeInTheDocument();
    expect(screen.getByText('👥 950')).toBeInTheDocument();
    expect(screen.getByText('+65.2% growth')).toBeInTheDocument();
  });

  test('displays comeback creators section when data exists', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Comeback creators section should be visible
    expect(screen.getByText('🔄 Comeback Creators')).toBeInTheDocument();
    expect(screen.getByText('Creators making a strong return')).toBeInTheDocument();
    expect(screen.getByText('Comeback King')).toBeInTheDocument();
    expect(screen.getByText('+125.3% growth')).toBeInTheDocument();
  });

  test('hides comeback creators section when no data', async () => {
    const dataWithoutComeback = {
      ...mockGrowthData,
      comeback_creators: []
    };

    axios.get.mockResolvedValueOnce({
      data: {
        data: dataWithoutComeback
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('🔄 Comeback Creators')).not.toBeInTheDocument();
  });

  test('handles API error with retry functionality', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load growth trends. Please try again.')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Rising Star Creator')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('displays trending badges for top performers', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Top 3 fastest growing should have fire badges
    const fireEmojis = screen.getAllByText('🔥');
    expect(fireEmojis).toHaveLength(2); // Only 2 fastest growing creators in mock data
  });

  test('prioritizes supporter metrics over monetary values', async () => {
    // Test data with both supporter and monetary values
    const mixedData = {
      ...mockGrowthData,
      fastest_growing: [
        {
          id: 1,
          name: 'Test Creator',
          username: 'testcreator',
          avatar_url: 'avatar1.jpg',
          role: 1,
          profile_status_lock: 1,
          supporters: 500,
          growth_percentage: 45.0,
          current_amount: 1000.00, // Should be ignored
          currency: 'USD'          // Should be ignored
        }
      ]
    };

    axios.get.mockResolvedValueOnce({
      data: {
        data: mixedData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should show supporter count, not monetary value
    expect(screen.getByText('👥 500')).toBeInTheDocument();
    expect(screen.queryByText('1000.00 USD')).not.toBeInTheDocument();
  });

  test('fetches data from correct API endpoint', () => {
    render(<GrowthTrends />);
    
    expect(axios.get).toHaveBeenCalledWith('leaderboard/growth-trends');
  });

  test('displays growth percentage correctly formatted', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check various growth percentages are displayed with + sign and % symbol
    expect(screen.getByText('+85.5% growth')).toBeInTheDocument();
    expect(screen.getByText('+65.2% growth')).toBeInTheDocument();
    expect(screen.getByText('+125.3% growth')).toBeInTheDocument();
  });

  test('renders trend cards with correct icons and values', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: mockGrowthData
      }
    });

    render(<GrowthTrends />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check trend card icons are rendered
    expect(screen.getByTestId('pulse-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('arrow-up-icon')).toHaveLength(3); // Three arrow-up icons for growth metrics
  });
});

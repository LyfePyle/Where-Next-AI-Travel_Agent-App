# Where Next AI Travel Agent - Testing Guide

## 📋 Overview

This document provides comprehensive information about the testing infrastructure for the Where Next AI Travel Agent application. Our testing suite includes unit tests, integration tests, performance tests, database tests, and end-to-end tests.

## 🧪 Test Types & Coverage

### 1. Unit Tests (Jest + React Testing Library)
**Location**: `__tests__/components/`
**Purpose**: Test individual React components in isolation
**Coverage**: 
- Component rendering
- User interactions
- Props handling
- State management
- Error handling

**Key Components Tested**:
- TripSuggestionCard
- AirportAutocomplete
- FlightBookingForm

**Run Command**: 
```bash
npm test                    # Run once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### 2. API Integration Tests
**Location**: `test-comprehensive-apis.js`, `__tests__/api/`
**Purpose**: Test API endpoints and external service integrations
**Coverage**:
- OpenAI API integration
- Amadeus flight/hotel search
- Stripe payment processing
- Airport search functionality
- Currency conversion
- Trip management

**Run Command**:
```bash
npm run test:api           # Full API test suite
npm run test:booking       # Booking flow specific
npm run test:openai        # OpenAI integration
npm run test:amadeus       # Amadeus integration
```

### 3. Performance Tests
**Location**: `test-performance.js`
**Purpose**: Measure API response times and system performance
**Coverage**:
- API endpoint response times
- Concurrent request handling
- Load testing
- Stress testing
- Resource usage patterns

**Run Command**:
```bash
npm run test:performance
```

**Metrics Tracked**:
- Response times (expected < 2000ms for most APIs)
- Throughput (requests per second)
- Concurrent request handling
- Error rates under load

### 4. Database Tests
**Location**: `test-database.js`
**Purpose**: Test Supabase database operations
**Coverage**:
- Connection testing
- CRUD operations
- Query functionality
- Schema validation
- Authentication

**Run Command**:
```bash
npm run test:database
```

### 5. End-to-End Tests (Playwright)
**Location**: `e2e/`
**Purpose**: Test complete user workflows
**Coverage**:
- Homepage functionality
- Trip planning flow
- Booking process
- API integration in browser
- Responsive design

**Run Command**:
```bash
npm run test:e2e           # Headless mode
npm run test:e2e:headed    # With browser UI
npm run test:e2e:ui        # Playwright UI mode
```

## 🚀 Quick Start

### Prerequisites
1. **Server Running**: Start the development server
   ```bash
   npm run dev
   ```

2. **Environment Variables**: Ensure `.env.local` is configured with:
   - `OPENAI_API_KEY`
   - `AMADEUS_CLIENT_ID` & `AMADEUS_CLIENT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`

### Run All Tests
```bash
# Comprehensive test suite
node test-all.js

# Or run individual test types
npm run test:all
```

## 📊 Test Results Interpretation

### Success Rates
- **90%+**: Excellent - Ready for production
- **70-89%**: Good - Minor improvements needed  
- **50-69%**: Acceptable - Core functionality working
- **<50%**: Critical - Major issues need attention

### Critical Systems
The following are marked as critical for production readiness:
- API Integration Tests
- Booking Flow Tests

### Common Issues & Solutions

#### Environment Variable Issues
**Problem**: Tests fail with "Missing environment variables"
**Solution**: 
1. Copy `.env.example` to `.env.local`
2. Fill in actual API keys
3. Restart the development server

#### Server Not Running
**Problem**: "Server not running on localhost:3000"
**Solution**:
```bash
npm run dev
```

#### Database Connection Issues
**Problem**: Database tests fail with connection errors
**Solution**:
1. Verify Supabase credentials
2. Check database table setup
3. Run database setup scripts

#### Jest Configuration Issues
**Problem**: Jest tests fail to run
**Solution**:
1. Check `jest.config.js` configuration
2. Ensure all testing dependencies are installed
3. Clear Jest cache: `npm test -- --clearCache`

## 📈 Performance Benchmarks

### Expected Response Times
- **Home Page**: < 1000ms
- **AI Suggestions**: < 3000ms
- **Flight Search**: < 2000ms
- **Hotel Search**: < 2000ms
- **Airport Search**: < 500ms

### Load Testing Targets
- **5 concurrent users**: No failures
- **10 concurrent users**: < 5% failure rate
- **Throughput**: > 3 requests/second

## 🔧 Maintenance

### Adding New Tests

#### Component Tests
1. Create test file in `__tests__/components/`
2. Follow naming convention: `ComponentName.test.tsx`
3. Include render, interaction, and edge case tests

#### API Tests
1. Add endpoint to `test-comprehensive-apis.js`
2. Include positive and negative test cases
3. Test authentication and validation

#### E2E Tests
1. Create test file in `e2e/`
2. Follow user journey patterns
3. Include mobile and desktop testing

### Updating Test Configuration

#### Jest Configuration
File: `jest.config.js`
- Module mapping for path aliases
- Coverage thresholds
- Test environment setup

#### Playwright Configuration  
File: `playwright.config.ts`
- Browser configurations
- Test timeouts
- Reporter settings

## 📋 Test Scripts Reference

### Individual Test Commands
| Command | Purpose |
|---------|---------|
| `npm test` | Run Jest unit tests |
| `npm run test:api` | API integration tests |
| `npm run test:booking` | Booking flow tests |
| `npm run test:performance` | Performance benchmarks |
| `npm run test:database` | Database operations |
| `npm run test:e2e` | End-to-end tests |
| `npm run test:openai` | OpenAI integration |
| `npm run test:amadeus` | Amadeus integration |

### Comprehensive Commands
| Command | Purpose |
|---------|---------|
| `node test-all.js` | Run all tests with detailed reporting |
| `npm run test:all` | Run core test suites |
| `npm run test:coverage` | Generate coverage report |

## 🎯 Best Practices

### Writing Tests
1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use Descriptive Names**: Test names should explain the scenario
3. **Follow AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Use mocks for APIs and services
5. **Test Edge Cases**: Include error conditions and boundary values

### Maintaining Tests
1. **Keep Tests Fast**: Unit tests should run in milliseconds
2. **Update Tests with Code Changes**: Don't let tests become stale
3. **Review Test Coverage**: Aim for >80% coverage on critical paths
4. **Use Continuous Integration**: Run tests on every commit

### Performance Testing
1. **Set Realistic Expectations**: Based on actual user scenarios
2. **Test Under Load**: Include concurrent user scenarios
3. **Monitor Trends**: Track performance over time
4. **Profile Bottlenecks**: Identify and optimize slow endpoints

## 🔍 Troubleshooting

### Test Failures
1. **Check Server Status**: Ensure development server is running
2. **Verify Environment**: Confirm all required environment variables
3. **Review Logs**: Check console output for specific error messages
4. **Isolate Issues**: Run individual test suites to identify problems
5. **Clear Caches**: Sometimes clearing Jest/Playwright cache helps

### Performance Issues
1. **Check Network**: Ensure stable internet for API tests
2. **Review Timeout Settings**: Increase timeouts for slow endpoints
3. **Monitor Resources**: Check system CPU/memory usage
4. **Database Performance**: Verify Supabase connection speed

## 📞 Support

For issues with the testing infrastructure:
1. Check this guide first
2. Review test output logs
3. Check GitHub issues for similar problems
4. Create new issue with test logs and environment details

## 🎉 Success Metrics

Your testing setup is successful when:
- ✅ All critical systems pass
- ✅ Performance tests meet benchmarks
- ✅ Test coverage > 80% on core components
- ✅ E2E tests pass in multiple browsers
- ✅ CI/CD pipeline runs tests automatically

---

*Last Updated: September 2024*
*Version: 1.0*


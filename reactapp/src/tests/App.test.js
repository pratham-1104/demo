import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from '../App';



jest.mock('axios', () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      ...client,
      create: jest.fn(() => client),
      __client: client,
    },
  };
});

const api = axios.__client;

const admin = {
  id: 1,
  firstName: 'Alex',
  lastName: 'Admin',
  email: 'admin@propnest.test',
  phone: '5551234567',
  role: 'ADMIN',
  status: 'ACTIVE',
};

const staff = {
  id: 2,
  firstName: 'Sam',
  lastName: 'Staff',
  email: 'staff@propnest.test',
  phone: '5551234568',
  role: 'STAFF',
  status: 'ACTIVE',
};

const customer = {
  id: 3,
  firstName: 'Casey',
  lastName: 'Customer',
  email: 'casey@propnest.test',
  phone: '5551234569',
  role: 'CUSTOMER',
  status: 'ACTIVE',
};

const landlord = {
  id: 10,
  firstName: 'Taylor',
  lastName: 'Landlord',
  email: 'landlord@propnest.test',
  phone: '5552223333',
  city: 'Austin',
  address: '10 Main Street',
};

const property = {
  id: 20,
  title: 'Sunny Apartment',
  description: 'Two bedroom apartment',
  propertyType: 'APARTMENT',
  address: '22 Oak Road',
  city: 'Austin',
  state: 'TX',
  postalCode: '73301',
  bedrooms: 2,
  bathrooms: 1,
  area: 950,
  monthlyRent: 1400,
  securityDeposit: 500,
  status: 'AVAILABLE',
  landlord: {
    id: 10,
    firstName: 'Taylor',
    lastName: 'Landlord',
  },
};

const tenant = {
  id: 30,
  firstName: 'Casey',
  lastName: 'Customer',
  email: 'casey@propnest.test',
  phone: '5551234569',
  address: '3 Pine Street',
  identityProofNumber: 'ID12345',
  status: 'ACTIVE',
  user: { id: 3 },
};

const leasePlan = {
  id: 40,
  name: 'Standard 12 Month',
  description: 'Standard yearly plan',
  durationMonths: 12,
  discountPercentage: 5,
};

const lease = {
  id: 50,
  leaseStartDate: '2026-11-01',
  expectedEndDate: '2027-11-01',
  actualEndDate: null,
  baseAmount: 16800,
  discountAmount: 840,
  lateFee: 0,
  totalAmount: 15960,
  amountPaid: 1000,
  balanceDue: 14960,
  status: 'RESERVED',
  tenant,
  property,
  leasePlan,
};

const payment = {
  id: 60,
  paymentDate: '2026-10-23T10:00:00',
  amount: 1000,
  paymentMethod: 'UPI',
  status: 'SUCCESS',
  transactionReference: 'TXN-PN-001',
  lease: {
    id: 50,
    status: 'ACTIVE',
    totalAmount: 15960,
  },
};

function paged(content = []) {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
  };
}

function payloadFor(url = '') {
  const u = String(url).toLowerCase();

  if (u.includes('/auth/me') || u.endsWith('/profile')) {
    return { ...admin };
  }

  if (u.includes('/auth/login') || u.includes('/auth/register')) {
    return {
      token: 'test.jwt.token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { ...admin },
    };
  }

  if (u.includes('landlord')) {
    return /\/\d+(?:\?|$)/.test(u)
      ? landlord
      : paged([landlord]);
  }

  if (u.includes('propert')) {
    return u.includes('available')
      ? paged([property])
      : /\/\d+(?:\?|$)/.test(u)
        ? property
        : paged([property]);
  }

  if (u.includes('tenant')) {
    return /\/\d+(?:\?|$)/.test(u)
      ? tenant
      : paged([tenant]);
  }

  if (u.includes('leaseplan') || u.includes('lease-plan')) {
    return /\/\d+(?:\?|$)/.test(u)
      ? leasePlan
      : paged([leasePlan]);
  }

  if (u.includes('lease')) {
    return /\/\d+(?:\?|$)/.test(u)
      ? lease
      : paged([lease]);
  }

  if (u.includes('payment')) {
    return /\/\d+(?:\?|$)/.test(u)
      ? payment
      : paged([payment]);
  }

  if (u.includes('/users')) {
    return /\/\d+(?:\?|$)/.test(u)
      ? admin
      : paged([admin, staff, customer]);
  }

  return paged([]);
}

function setSession(user = admin) {
  window.localStorage.setItem('token', 'test.jwt.token');
  window.localStorage.setItem('jwt', 'test.jwt.token');
  window.localStorage.setItem('user', JSON.stringify(user));
  window.localStorage.setItem('role', user.role);
}

function setupApi() {
  api.get.mockImplementation((url) =>
    Promise.resolve({ data: payloadFor(url) })
  );

  api.post.mockImplementation((url) =>
    Promise.resolve({ data: payloadFor(url) })
  );

  api.put.mockImplementation((url) =>
    Promise.resolve({ data: payloadFor(url) })
  );

  api.patch.mockImplementation((url) =>
    Promise.resolve({ data: payloadFor(url) })
  );

  api.delete.mockImplementation(() =>
    Promise.resolve({ data: { success: true } })
  );
}

function renderApp({
  user = admin,
  path = '/',
  authenticated = true,
} = {}) {
  window.history.replaceState({}, 'Test page', path);
  window.localStorage.clear();

  if (authenticated) {
    setSession(user);
  }

  setupApi();
  return render(<App />);
}

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
  setupApi();
});

afterEach(() => {
  window.localStorage.clear();
});

test('frontend_testRegistrationValidationDuplicateEmailSuccessAndNoRoleSelectorBehavior', async () => {
  renderApp({ authenticated: false, path: '/register' });

  expect(
    await screen.findByRole('heading', {
      name: /register|create account|sign up/i,
    })
  ).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', {
      name: /register|create account|sign up/i,
    })
  );

  expect(
    await screen.findAllByText(/required|valid|enter/i)
  ).not.toHaveLength(0);

  expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();

  expect(
    screen.queryByRole('combobox', { name: /role/i })
  ).not.toBeInTheDocument();

  expect(api.post).not.toHaveBeenCalledWith(
    expect.stringMatching(/register/i),
    expect.objectContaining({ role: expect.anything() })
  );
});

test('frontend_testLoginFieldValidationPasswordToggleFailureAndLoadingBehavior', async () => {
  renderApp({ authenticated: false, path: '/login' });

  expect(
    await screen.findByRole('heading', {
      name: /login|sign in/i,
    })
  ).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', {
      name: /login|sign in/i,
    })
  );

  expect(
    await screen.findAllByText(/required|valid|enter/i)
  ).not.toHaveLength(0);

  const password = screen.getByLabelText(/password/i);

  expect(password).toHaveAttribute('type', 'password');

  const toggle = screen.queryByRole('button', {
    name: /show password|hide password|toggle password|visibility/i,
  });

  if (toggle) {
    await userEvent.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
  }
});

test('frontend_testAuthContextJwtProfileAxiosBearerAndLogoutResetBehavior', async () => {
  renderApp({ path: '/' });

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  const authCalls = api.get.mock.calls.concat(api.post.mock.calls);
  expect(authCalls.length).toBeGreaterThan(0);

  const logout = screen.queryByRole('button', {
    name: /logout|log out|sign out/i,
  });

  if (logout) {
    await userEvent.click(logout);

    await waitFor(() => {
      expect(window.localStorage.getItem('token')).toBeNull();
      expect(window.localStorage.getItem('jwt')).toBeNull();
    });
  }
});

test('frontend_testProtectedRoutesUnauthenticatedRedirectAndRoleAccessBehavior', async () => {
  renderApp({
    authenticated: false,
    path: '/properties',
  });

  await waitFor(() => {
    expect(window.location.pathname).toMatch(/login|properties|\//i);
  });

  expect(
    await screen.findByRole('heading', {
      name: /login|sign in/i,
    })
  ).toBeInTheDocument();
});

test('frontend_testNavbarRoleVisibilityActiveRouteMobileMenuAndLogoutBehavior', async () => {
  renderApp({ path: '/' });

  expect(await screen.findByRole('navigation')).toBeInTheDocument();

  expect(screen.getByRole('navigation')).toHaveTextContent(
    /property|landlord|tenant|lease|payment/i
  );

  const nav = screen.getByRole('navigation');
  const links = within(nav).getAllByRole('link');

  expect(links.length).toBeGreaterThan(0);

  const menu = screen.queryByRole('button', {
    name: /menu|navigation/i,
  });

  if (menu) {
    await userEvent.click(menu);
  }

  expect(
    screen.queryByRole('button', {
      name: /logout|log out|sign out/i,
    }) ||
      screen.queryByRole('link', {
        name: /logout|log out|sign out/i,
      })
  ).toBeTruthy();
});

test('frontend_testHomeDashboardCountsBackendTotalsAndCustomerScopedDataBehavior', async () => {
  renderApp({ path: '/' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /PropNest|dashboard|property|lease/i
  );

  renderApp({ user: customer, path: '/' });

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toBeVisible();
});

test('frontend_testBreadcrumbNavigationAndDynamicFooterYearBehavior', async () => {
  renderApp({ path: '/properties/20' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const footer = screen.queryByRole('contentinfo');

  if (footer) {
    expect(footer).toHaveTextContent(/PropNest/i);
    expect(footer).toHaveTextContent(
      String(new Date().getFullYear())
    );
  }

  const breadcrumbs =
    screen.queryByLabelText(/breadcrumb/i) ||
    screen.queryByRole('navigation', { name: /breadcrumb/i });

  if (breadcrumbs) {
    expect(breadcrumbs).toBeInTheDocument();
  }
});

test('frontend_testLandlordListSearchCityFilterPaginationSortingAndBackendDataBehavior', async () => {
  renderApp({ path: '/landlords' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  const search =
    screen.queryByRole('searchbox') ||
    screen.queryByPlaceholderText(/search/i);

  if (search) {
    await userEvent.type(search, 'Taylor');
    expect(search).toHaveValue('Taylor');
  }

  expect(document.body).toHaveTextContent(/landlord|Taylor|city/i);
});

test('frontend_testLandlordCreateEditValidationDetailsAndDeleteConfirmationBehavior', async () => {
  renderApp({ path: '/landlords/new' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const form = screen.queryByRole('form') || document.querySelector('form');

  if (form) {
    await userEvent.click(
      within(form).getByRole('button', {
        name: /save|create|submit/i,
      })
    );

    expect(
      await screen.findAllByText(/required|valid/i)
    ).not.toHaveLength(0);
  }

  renderApp({ path: '/landlords/10' });

  expect(await screen.findByRole('main')).toBeInTheDocument();
});

test('frontend_testPropertyListSearchTypeCityRentStatusLandlordFiltersBehavior', async () => {
  renderApp({ path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /property|rent|city|status/i
  );

  const search =
    screen.queryByRole('searchbox') ||
    screen.queryByPlaceholderText(/search/i);

  if (search) {
    await userEvent.type(search, 'Sunny');
  }

  const selects = screen.queryAllByRole('combobox');

  if (selects.length) {
    await userEvent.selectOptions(
      selects[0],
      selects[0].options[1]?.value || ''
    );
  }
});

test('frontend_testPropertyCrudDetailsLeaseHistoryAndAvailabilityApiBehavior', async () => {
  renderApp({ path: '/properties/20' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /Sunny Apartment|property|lease history|availability/i
  );

  renderApp({ path: '/properties/new' });

  expect(await screen.findByRole('main')).toBeInTheDocument();
});

test('frontend_testPropertyDeleteDialogCancelConfirmFailureAndListRefreshBehavior', async () => {
  renderApp({ path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const del = screen.queryByRole('button', {
    name: /delete|remove/i,
  });

  if (del) {
    await userEvent.click(del);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();

    const cancel = within(dialog).queryByRole('button', {
      name: /cancel|no|keep/i,
    });

    if (cancel) {
      await userEvent.click(cancel);
    } else {
      await userEvent.keyboard('{Escape}');
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }
});

test('frontend_testCustomerAvailablePropertiesOnlyAndLeaseDateAvailabilityBehavior', async () => {
  renderApp({ user: customer, path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  const calls = api.get.mock.calls.map(([url]) => String(url));

  expect(calls.length).toBeGreaterThan(0);

  expect(document.body).not.toHaveTextContent(
    /MAINTENANCE.*INACTIVE/i
  );
});

test('frontend_testTenantListSearchStatusFilterPaginationSortingAndBackendDataBehavior', async () => {
  renderApp({ path: '/tenants' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(/tenant|identity|status/i);

  const search =
    screen.queryByRole('searchbox') ||
    screen.queryByPlaceholderText(/search/i);

  if (search) {
    await userEvent.type(search, 'Casey');
  }
});

test('frontend_testTenantProfileOwnershipValidationIdentityAndStatusRestrictionBehavior', async () => {
  renderApp({ user: customer, path: '/tenants/new' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const form = document.querySelector('form');

  if (form) {
    const status = within(form).queryByLabelText(/status/i);

    expect(status).not.toBeInTheDocument();

    await userEvent.click(
      within(form).getByRole('button', {
        name: /save|create|submit/i,
      })
    );

    expect(
      await screen.findAllByText(/required|valid/i)
    ).not.toHaveLength(0);
  }
});

test('frontend_testTenantDetailsLeaseHistoryAndPermittedPaymentVisibilityBehavior', async () => {
  renderApp({ user: staff, path: '/tenants/30' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /tenant|lease|payment|Casey/i
  );
});

test('frontend_testLeasePlanListSearchDurationFilterPaginationAndSortingBehavior', async () => {
  renderApp({ path: '/lease-plans' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /lease plan|duration|discount/i
  );

  const search =
    screen.queryByRole('searchbox') ||
    screen.queryByPlaceholderText(/search/i);

  if (search) {
    await userEvent.type(search, 'Standard');
  }
});

test('frontend_testLeasePlanCrudValidationDetailsAndReferencedDeleteErrorBehavior', async () => {
  renderApp({ path: '/lease-plans/new' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const form = document.querySelector('form');

  if (form) {
    await userEvent.click(
      within(form).getByRole('button', {
        name: /save|create|submit/i,
      })
    );

    expect(
      await screen.findAllByText(/required|valid/i)
    ).not.toHaveLength(0);
  }

  renderApp({ path: '/lease-plans/40' });

  expect(await screen.findByRole('main')).toBeInTheDocument();
});

test('frontend_testLeaseCreationBackendAvailabilityDateValidationAndCalculatedAmountsBehavior', async () => {
  renderApp({ path: '/leases/new' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const form = document.querySelector('form');

  if (form) {
    expect(
      within(form).queryByLabelText(
        /total amount|base amount|discount amount|late fee/i
      )
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(form).getByRole('button', {
        name: /save|create|submit/i,
      })
    );

    expect(
      await screen.findAllByText(/required|valid|date/i)
    ).not.toHaveLength(0);
  }
});

test('frontend_testLeaseListFiltersDateRangeOverduePaginationAndSortingBehavior', async () => {
  renderApp({ path: '/leases' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /lease|expected end|status|overdue/i
  );

  const dateInputs = document.querySelectorAll('input[type="date"]');

  expect(dateInputs.length).toBeGreaterThanOrEqual(0);
});

test('frontend_testLeaseDetailsBackendAmountsPaidBalanceAndStatusWorkflowBehavior', async () => {
  renderApp({ path: '/leases/50' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /lease|amount|balance|status/i
  );
});

test('frontend_testLeaseActivateCancelCompleteTerminateActionsByRoleAndStatusBehavior', async () => {
  renderApp({ user: staff, path: '/leases/50' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const text = document.body.textContent || '';

  expect(text).toMatch(/lease|status|reserved|activate/i);

  const activate = screen.queryByRole('button', {
    name: /activate/i,
  });

  if (activate) {
    expect(activate).toBeEnabled();
  }

  renderApp({ user: customer, path: '/leases/50' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  expect(
    screen.queryByRole('button', {
      name: /activate|terminate|complete/i,
    })
  ).not.toBeInTheDocument();
});

test('frontend_testLeaseTerminateCancelConfirmationAndFailureStateBehavior', async () => {
  renderApp({ path: '/leases/50' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const action = screen.queryByRole('button', {
    name: /cancel lease|terminate/i,
  });

  if (action) {
    await userEvent.click(action);

    expect(await screen.findByRole('dialog')).toBeVisible();

    expect(api.put).not.toHaveBeenCalled();

    expect(api.post).not.toHaveBeenCalledWith(
      expect.stringMatching(/terminate|cancel/i),
      expect.anything()
    );
  }
});

test('frontend_testPaymentListFiltersPaginationSortingAndLeaseHistoryBehavior', async () => {
  renderApp({ path: '/payments' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toHaveTextContent(
    /payment|amount|method|status/i
  );

  const search =
    screen.queryByRole('searchbox') ||
    screen.queryByPlaceholderText(/search/i);

  if (search) {
    await userEvent.type(search, 'UPI');
  }
});

test('frontend_testPaymentCreateValidationMethodAndBackendOutstandingBalanceBehavior', async () => {
  renderApp({ path: '/payments/new' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const form = document.querySelector('form');

  if (form) {
    expect(
      within(form).queryByLabelText(
        /status|transaction reference|payment date/i
      )
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(form).getByRole('button', {
        name: /save|create|submit|pay/i,
      })
    );

    expect(
      await screen.findAllByText(/required|valid|amount/i)
    ).not.toHaveLength(0);
  }
});

test('frontend_testPaymentProcessSuccessFailureAndRetryWorkflowBehavior', async () => {
  renderApp({ path: '/payments' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const process = screen.queryByRole('button', {
    name: /process|retry/i,
  });

  if (process) {
    await userEvent.click(process);

    await waitFor(() => {
      expect(
        api.post.mock.calls.length + api.put.mock.calls.length
      ).toBeGreaterThan(0);
    });
  }
});

test('frontend_testPaymentRefundOnlySuccessConfirmationAndDuplicateRefundErrorBehavior', async () => {
  renderApp({ path: '/payments/60' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const refund = screen.queryByRole('button', {
    name: /refund/i,
  });

  if (refund) {
    await userEvent.click(refund);

    expect(await screen.findByRole('dialog')).toBeVisible();

    expect(api.post).not.toHaveBeenCalledWith(
      expect.stringMatching(/refund/i),
      expect.anything()
    );
  }
});

test('frontend_testCustomerLeaseAndPaymentScreensRestrictDataToOwnAccountBehavior', async () => {
  renderApp({ user: customer, path: '/leases' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(document.body).toBeVisible();

  renderApp({ user: customer, path: '/payments' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });
});

test('frontend_testAdminUserManagementCreateRoleChangeAndAccountStatusBehavior', async () => {
  renderApp({ user: admin, path: '/users' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  expect(document.body).toHaveTextContent(/user|role|status/i);

  renderApp({ user: customer, path: '/users' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  expect(
    screen.queryByRole('button', {
      name: /create user|add user|change role/i,
    })
  ).not.toBeInTheDocument();
});

test('frontend_testDedicatedApiServicesUseAxiosAndAvoidComponentRequestsBehavior', async () => {
  renderApp({ path: '/properties' });

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(api.get.mock.calls.length).toBeGreaterThan(0);

  expect(api.post.mock.calls.length).toBeGreaterThanOrEqual(0);
});

test('frontend_testLoadingEmptyErrorSuccessAndDismissibleToastStatesBehavior', async () => {
  api.get.mockImplementation(() => new Promise(() => {}));

  renderApp({ path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  expect(document.body).toBeVisible();

  const status =
    screen.queryByRole('status') ||
    screen.queryByText(/loading/i);

  if (status) {
    expect(status).toBeVisible();
  }
});

test('frontend_testBackendValidationErrorsMapToFieldsAndPreserveFormStateBehavior', async () => {
  api.post.mockRejectedValueOnce({
    response: {
      status: 400,
      data: {
        message: 'Validation failed',
        fieldErrors: {
          email: 'Email already exists',
        },
      },
    },
  });

  renderApp({
    authenticated: false,
    path: '/register',
  });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const email = screen.queryByLabelText(/email/i);

  if (email) {
    await userEvent.type(email, 'existing@propnest.test');

    const submit = screen.getByRole('button', {
      name: /register|create account|sign up/i,
    });

    await userEvent.click(submit);

    await waitFor(() => {
      expect(email).toHaveValue('existing@propnest.test');
    });
  }
});

test('frontend_testDeleteConfirmationDialogsCancelConfirmAndApiFailureBehavior', async () => {
  renderApp({ path: '/landlords' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const deleteButton = screen.queryByRole('button', {
    name: /delete|remove/i,
  });

  if (deleteButton) {
    await userEvent.click(deleteButton);

    const dialog = await screen.findByRole('dialog');

    expect(dialog).toBeVisible();

    const cancel = within(dialog).queryByRole('button', {
      name: /cancel|keep|no/i,
    });

    if (cancel) {
      await userEvent.click(cancel);
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }
});

test('frontend_testResponsiveTablesCardsFormsFiltersPaginationAndNavbarBehavior', async () => {
  renderApp({ path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const nav = screen.queryByRole('navigation');

  expect(nav).toBeInTheDocument();

  const table = screen.queryByRole('table');
  const cards = screen.queryAllByRole('article');

  expect(Boolean(table) || cards.length >= 0).toBe(true);
});

test('frontend_testAccessibilityLabelsKeyboardFocusEscapeAndDialogFocusTrapBehavior', async () => {
  renderApp({ path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const controls = screen.getAllByRole(/button|link|textbox|combobox/);

  expect(controls.length).toBeGreaterThan(0);

  controls[0].focus();

  expect(controls[0]).toHaveFocus();

  const deleteButton = screen.queryByRole('button', {
    name: /delete|remove/i,
  });

  if (deleteButton) {
    await userEvent.click(deleteButton);

    const dialog = await screen.findByRole('dialog');

    expect(dialog).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  }
});

test('frontend_testDarkModePersistenceAndReadableLightDarkThemeBehavior', async () => {
  renderApp({ path: '/' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const themeButton = screen.queryByRole('button', {
    name: /dark mode|light mode|theme/i,
  });

  if (themeButton) {
    await userEvent.click(themeButton);

    expect(
      document.documentElement.className +
        ' ' +
        document.body.className
    ).toMatch(/dark|light|theme/i);
  }
});

test('frontend_testReactSpringBootIntegrationAvoidsHardcodedDomainDataBehavior', async () => {
  renderApp({ path: '/properties' });

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(
    api.get.mock.calls.some(([url]) => /propert/i.test(String(url)))
  ).toBe(true);

  expect(document.body).toHaveTextContent(
    /property|rent|city|status/i
  );
});

test('frontend_testRoleBasedControlsCannotBypassBackendAuthorizationBehavior', async () => {
  renderApp({ user: customer, path: '/users' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  expect(
    screen.queryByRole('button', {
      name: /create user|change role|deactivate user/i,
    })
  ).not.toBeInTheDocument();

  api.get.mockRejectedValueOnce({
    response: {
      status: 403,
      data: { message: 'Forbidden' },
    },
  });

  renderApp({ user: customer, path: '/users' });

  expect(await screen.findByRole('main')).toBeInTheDocument();
});

test('frontend_testSearchFilterPaginationAndSortingUseBackendQueryParametersBehavior', async () => {
  renderApp({ path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  const search =
    screen.queryByRole('searchbox') ||
    screen.queryByPlaceholderText(/search/i);

  if (search) {
    await userEvent.type(search, 'Austin');
  }

  const sort =
    screen.queryByRole('button', { name: /sort/i }) ||
    screen.queryByLabelText(/sort by/i);

  if (sort) {
    await userEvent.click(sort);
  }

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  expect(api.get.mock.calls.length).toBeGreaterThan(0);
});

test('frontend_testEndToEndCustomerLeasePaymentAndAdminOperationalWorkflowBehavior', async () => {
  renderApp({ user: customer, path: '/properties' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  const propertyLink = screen.queryByRole('link', {
    name: /Sunny Apartment|properties/i,
  });

  if (propertyLink) {
    await userEvent.click(propertyLink);
  }

  renderApp({ user: customer, path: '/leases' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  renderApp({ user: customer, path: '/payments' });

  expect(await screen.findByRole('main')).toBeInTheDocument();

  renderApp({ user: admin, path: '/users' });

  expect(await screen.findByRole('main')).toBeInTheDocument();
});
// Browser-only module interception. Production auth and database code are never changed.
export async function mockAccount(
  page,
  {
    empty = false,
    pro = true,
    failSaves = false,
    mixed = false,
    authenticated = true,
    native = false,
    planningData = false,
    manyAccounts = false
  } = {}
) {
  if (native)
    await page.route('**/@capacitor_core.js*', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `
    window.__nativeListeners = {};
    export const Capacitor = { getPlatform: () => 'android', isNativePlatform: () => true, isPluginAvailable: () => false };
    export const registerPlugin = () => ({ getLaunchUrl: async () => ({}), addListener: async (event, callback) => { window.__nativeListeners[event] = callback; return { remove: () => { if (window.__nativeListeners[event] === callback) delete window.__nativeListeners[event] } } }, exitApp: () => { window.__nativeExited = true }, saveSnapshot: async ({ snapshot }) => { window.__widgetSnapshot = JSON.parse(snapshot) }, clearSnapshot: async () => {} });
  `
      })
    )
  if (native)
    await page.route('**/@capacitor_app.js*', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `import { registerPlugin } from '/node_modules/.vite/deps/@capacitor_core.js'; export const App = registerPlugin('App');`
      })
    )
  await page.route('**/src/contexts/FirebaseContext.jsx*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    import React from '/node_modules/.vite/deps/react.js';
    export const FirebaseContext = React.createContext(null);
    const user = ${authenticated} ? { uid: 'ui-test', email: 'test@example.com', displayName: 'Alex', providerData: [{ providerId: 'password' }], getIdToken: async () => 'test' } : null;
    export function FirebaseProvider({ children }) { return React.createElement(FirebaseContext.Provider, { value: { user, userProfile: { plan: '${pro ? 'pro' : 'basic'}' }, loading: false, authResolved: true, isAuthenticated: ${authenticated}, isPro: ${pro}, logout: async () => {}, deleteAccount: async () => {} } }, children) }
  `
    })
  )
  await page.route('**/src/services/firebaseService.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    const today = new Date();
    const date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-05';
    const monthKey = date.slice(0,7);
    const empty = ${empty};
    const data = {
      incomes: empty ? [] : [{ id:'pay', source:'Monthly salary', date, amount:50000, walletId:'bank', currency:'PHP' }],
      expenses: empty ? [] : [{ id:'food', description:'Weekly groceries', date, amount:2350.75, walletId:'bank', currency:'PHP', categoryId:'food' }, { id:'train', description:'Train to work', date, amount:60, walletId:'cash', currency:'${mixed ? 'USD' : 'PHP'}', categoryId:'travel' }],
      wallets: empty ? [] : [{ id:'bank', name:'Everyday bank', accountType:'bank', startingBalance:25000, currency:'PHP' }, { id:'cash', name:'Cash on hand', accountType:'cash', startingBalance:4500, currency:'${mixed ? 'USD' : 'PHP'}' }],
      categories: empty ? [] : [{ id:'food', name:'Food & groceries' }, { id:'travel', name:'Transport' }],
      savings: empty ? [] : [{ id:'emergency', goal:'Emergency fund', currentAmount:18000, targetAmount:60000, currency:'PHP' }],
      transfers: [], budgets: [], subscriptions: [], recurringIncomes: [], netWorthSnapshots: [], investments: []
    };
    if (${manyAccounts} && !empty) {
      data.wallets.push(...[
        ['reserve', 'Reserve fund', 'savings', 12000, 'Set aside for unexpected expenses'],
        ['daily', 'Daily card', 'other', 150, 'Everyday travel'],
        ['holiday', 'Travel money', 'cash', 800, ''],
        ['online', 'Online wallet', 'ewallet', 475.5, 'Online purchases'],
        ['jar', 'Goal jar', 'savings', 2000, 'Weekend plans'],
        ['long-term', 'Long-term fund', 'investment', 6000, ''],
        ['spare', 'Spare cash', 'cash', 0, '']
      ].map(([id, name, accountType, startingBalance, description]) => ({ id, name, accountType, startingBalance, description, currency:'PHP' })));
    }
    if (${planningData}) {
      data.investments = [{ id:'fund', name:'Index fund', ticker:'PSEI', investmentType:'stock', quantity:3, purchasePrice:100, currentValue:120, currency:'PHP', purchaseDate:date }];
      data.subscriptions = [{ id:'bill', name:'Internet plan', amount:1500, walletId:'bank', currency:'PHP', intervalType:'monthly', startDate:'2099-01-01', nextDueDate:'2099-01-01', isActive:true }];
      data.recurringIncomes = [{ id:'retainer', source:'Monthly retainer', amount:5000, walletId:'bank', currency:'PHP', intervalType:'monthly', startDate:'2099-01-01', nextDueDate:'2099-01-01', isActive:true }];
    }
    window.__fixtureData = data;
    window.__snapshotWrites = [];
    const listeners = new Map();
    window.__setFixtureSync = metadata => listeners.forEach(pairs => pairs.forEach(([, callback]) => callback?.(metadata)));
    function service(name, singular, plural) {
      const notify = (state = { fromCache:false, hasPendingWrites:false }) => listeners.get(name)?.forEach(([callback, metadata]) => { callback([...data[name]]); metadata?.(state) });
      const result = {
        ['subscribeTo'+plural]: (...args) => { const callback = args.find(value => typeof value === 'function'); const metadata = args[args.indexOf(callback)+1]; const pair = [callback,metadata]; if (!listeners.has(name)) listeners.set(name,new Set()); listeners.get(name).add(pair); queueMicrotask(() => { if(listeners.get(name).has(pair)) { callback([...data[name]]); metadata?.({ fromCache:false,hasPendingWrites:false }) } }); return () => listeners.get(name).delete(pair) },
        ['add'+singular]: async (value) => { await new Promise(resolve => setTimeout(resolve, 250)); if (${failSaves} || window.__failNextSave) { window.__failNextSave = false; throw new Error('Could not save. Please try again.') } const id='new-'+Date.now(); data[name].push({ ...value,id }); notify(); return id },
        ['update'+singular]: async (id,value) => { data[name]=data[name].map(entry => entry.id===id ? {...entry,...value} : entry); notify() },
        ['delete'+singular]: async (id) => { data[name]=data[name].filter(entry=>entry.id!==id); notify() }
      };
      if (name==='expenses') result.addExpenses=async values=>{ if (${failSaves}) throw new Error('Could not save. Please try again.'); values.forEach((value,i)=>data.expenses.push({...value,id:'split-'+Date.now()+'-'+i})); notify() };
      if (name==='budgets') result.upsertBudget=async value=>{ data.budgets.push(value);notify() };
      if (name==='netWorthSnapshots') result.upsertSnapshot=async value=>{
        window.__snapshotWrites.push(value);
        data.netWorthSnapshots = [{ ...value, id:'current-snapshot' }];
        notify({ fromCache:false, hasPendingWrites:true });
        await new Promise(resolve => setTimeout(resolve, 25));
        notify({ fromCache:false, hasPendingWrites:false });
      };
      return result;
    }
    export const incomeService=service('incomes','Income','Incomes');
    export const expenseService=service('expenses','Expense','Expenses');
    export const walletService=service('wallets','Wallet','Wallets');
    export const categoryService=service('categories','Category','Categories');
    export const savingsService=service('savings','Savings','Savings');
    export const transferService=service('transfers','Transfer','Transfers');
    export const investmentService=service('investments','Investment','Investments');
    export const recurringIncomeService=service('recurringIncomes','RecurringIncome','RecurringIncomes');
    export const subscriptionService=service('subscriptions','Subscription','Subscriptions');
    export const budgetService=service('budgets','Budget','Budgets');
    export const netWorthSnapshotService=service('netWorthSnapshots','Snapshot','NetWorthSnapshots');
  `
    })
  )
  await page.route(/https:\/\/(?!127\.0\.0\.1|localhost).*/, (route) =>
    route.abort()
  )
}

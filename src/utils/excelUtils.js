/**
 * Excel Import/Export Utilities
 * Handles CSV format for Excel compatibility
 */

// Export all data to Excel-compatible CSV
export function exportToExcel(data) {
  const {
    incomes = [],
    expenses = [],
    transfers = [],
    investments = [],
    wallets = [],
    categories = [],
    selectedMonth,
    selectedYear
  } = data

  // Create workbook with multiple sheets (as separate CSV sections)
  const sections = []

  // Summary section
  sections.push('=== SUMMARY ===')
  sections.push(`Export Date,${new Date().toISOString()}`)
  sections.push(`Period,${getMonthName(selectedMonth)} ${selectedYear}`)
  sections.push('')

  // Incomes
  if (incomes.length > 0) {
    sections.push('=== INCOME ===')
    sections.push('Date,Source,Amount,Wallet,Notes')
    incomes.forEach(inc => {
      const wallet = wallets.find(w => w.id === inc.walletId)
      sections.push([
        inc.date,
        escapeCsv(inc.source),
        inc.amount,
        escapeCsv(wallet?.name || ''),
        escapeCsv(inc.notes || '')
      ].join(','))
    })
    sections.push('')
  }

  // Expenses
  if (expenses.length > 0) {
    sections.push('=== EXPENSES ===')
    sections.push('Date,Description,Amount,Category,Wallet,Notes')
    expenses.forEach(exp => {
      const wallet = wallets.find(w => w.id === exp.walletId)
      sections.push([
        exp.date,
        escapeCsv(exp.description),
        exp.amount,
        escapeCsv(exp.category || ''),
        escapeCsv(wallet?.name || ''),
        escapeCsv(exp.notes || '')
      ].join(','))
    })
    sections.push('')
  }

  // Transfers
  if (transfers.length > 0) {
    sections.push('=== TRANSFERS ===')
    sections.push('Date,From Wallet,To Wallet,Amount,Notes')
    transfers.forEach(trans => {
      const fromWallet = wallets.find(w => w.id === trans.fromWalletId)
      const toWallet = wallets.find(w => w.id === trans.toWalletId)
      sections.push([
        trans.date,
        escapeCsv(fromWallet?.name || ''),
        escapeCsv(toWallet?.name || ''),
        trans.amount,
        escapeCsv(trans.notes || '')
      ].join(','))
    })
    sections.push('')
  }

  // Investments
  if (investments.length > 0) {
    sections.push('=== INVESTMENTS ===')
    sections.push('Name,Type,Ticker,Quantity,Purchase Price,Current Value,Purchase Date,Notes')
    investments.forEach(inv => {
      sections.push([
        escapeCsv(inv.name),
        escapeCsv(inv.investmentType),
        escapeCsv(inv.ticker || ''),
        inv.quantity,
        inv.purchasePrice,
        inv.currentValue || inv.purchasePrice,
        inv.purchaseDate,
        escapeCsv(inv.notes || '')
      ].join(','))
    })
    sections.push('')
  }

  // Wallets/Accounts
  if (wallets.length > 0) {
    sections.push('=== ACCOUNTS ===')
    sections.push('Name,Type,Starting Balance,Description')
    wallets.forEach(wallet => {
      sections.push([
        escapeCsv(wallet.name),
        escapeCsv(wallet.accountType || 'cash'),
        wallet.startingBalance || 0,
        escapeCsv(wallet.description || '')
      ].join(','))
    })
    sections.push('')
  }

  // Categories
  if (categories.length > 0) {
    sections.push('=== CATEGORIES ===')
    sections.push('Name,Color')
    categories.forEach(cat => {
      sections.push([
        escapeCsv(cat.name),
        escapeCsv(cat.color || '')
      ].join(','))
    })
    sections.push('')
  }

  const csvContent = sections.join('\n')

  // Download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // UTF-8 BOM for Excel
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `budget-book-export-${selectedYear}-${selectedMonth + 1}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Import data from Excel CSV file
export async function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target.result
        const parsed = parseExcelCsv(text)
        resolve(parsed)
      } catch (error) {
        reject(new Error('Failed to parse file: ' + error.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

// Parse CSV content into structured data
function parseExcelCsv(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  const result = {
    incomes: [],
    expenses: [],
    transfers: [],
    investments: [],
    wallets: [],
    categories: []
  }

  let currentSection = null
  let headers = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect section headers
    if (line.startsWith('===')) {
      if (line.includes('INCOME')) currentSection = 'incomes'
      else if (line.includes('EXPENSES')) currentSection = 'expenses'
      else if (line.includes('TRANSFERS')) currentSection = 'transfers'
      else if (line.includes('INVESTMENTS')) currentSection = 'investments'
      else if (line.includes('ACCOUNTS')) currentSection = 'wallets'
      else if (line.includes('CATEGORIES')) currentSection = 'categories'
      else currentSection = null
      continue
    }

    // Skip summary and empty lines
    if (!currentSection || line.startsWith('Export Date') || line.startsWith('Period')) {
      continue
    }

    const cells = parseCsvLine(line)

    // First line of each section is headers
    if (headers.length === 0 || (cells[0] && (cells[0].includes('Date') || cells[0].includes('Name')))) {
      headers = cells
      continue
    }

    // Parse data based on section
    try {
      const row = {}
      cells.forEach((cell, index) => {
        if (headers[index]) {
          row[headers[index].toLowerCase().replace(/\s+/g, '_')] = cell
        }
      })

      if (currentSection === 'incomes' && row.source) {
        result.incomes.push({
          date: row.date,
          source: row.source,
          amount: parseFloat(row.amount) || 0,
          walletName: row.wallet,
          notes: row.notes || ''
        })
      } else if (currentSection === 'expenses' && row.description) {
        result.expenses.push({
          date: row.date,
          description: row.description,
          amount: parseFloat(row.amount) || 0,
          category: row.category || '',
          walletName: row.wallet,
          notes: row.notes || ''
        })
      } else if (currentSection === 'transfers' && row.from_wallet) {
        result.transfers.push({
          date: row.date,
          fromWalletName: row.from_wallet,
          toWalletName: row.to_wallet,
          amount: parseFloat(row.amount) || 0,
          notes: row.notes || ''
        })
      } else if (currentSection === 'investments' && row.name) {
        result.investments.push({
          name: row.name,
          investmentType: row.type || 'other',
          ticker: row.ticker || '',
          quantity: parseFloat(row.quantity) || 0,
          purchasePrice: parseFloat(row.purchase_price) || 0,
          currentValue: parseFloat(row.current_value) || parseFloat(row.purchase_price) || 0,
          purchaseDate: row.purchase_date,
          notes: row.notes || ''
        })
      } else if (currentSection === 'wallets' && row.name) {
        result.wallets.push({
          name: row.name,
          accountType: row.type || 'cash',
          startingBalance: parseFloat(row.starting_balance) || 0,
          description: row.description || ''
        })
      } else if (currentSection === 'categories' && row.name) {
        result.categories.push({
          name: row.name,
          color: row.color || ''
        })
      }
    } catch (err) {
      console.warn('Skipping malformed row:', line, err)
    }

    // Reset headers for next section
    if (i < lines.length - 1 && lines[i + 1].startsWith('===')) {
      headers = []
    }
  }

  return result
}

// Parse a single CSV line handling quotes
function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells.map(cell => cell.replace(/^"|"$/g, '')) // Remove surrounding quotes
}

// Escape CSV values
function escapeCsv(value) {
  if (!value) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Helper to get month name
function getMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex] || ''
}

// Template for users to download
export function downloadImportTemplate() {
  const template = `=== ACCOUNTS ===
Name,Type,Starting Balance,Description
Main Wallet,cash,1000.00,My primary wallet
Bank Account,bank,5000.00,Savings account

=== CATEGORIES ===
Name,Color
Food,#ef4444
Transport,#3b82f6
Entertainment,#8b5cf6

=== INCOME ===
Date,Source,Amount,Wallet,Notes
2024-03-01,Salary,50000.00,Bank Account,Monthly salary
2024-03-15,Freelance,5000.00,Main Wallet,Project payment

=== EXPENSES ===
Date,Description,Amount,Category,Wallet,Notes
2024-03-02,Groceries,1500.00,Food,Main Wallet,Weekly shopping
2024-03-05,Gas,800.00,Transport,Main Wallet,Fuel

=== TRANSFERS ===
Date,From Wallet,To Wallet,Amount,Notes
2024-03-10,Bank Account,Main Wallet,2000.00,Cash withdrawal

=== INVESTMENTS ===
Name,Type,Ticker,Quantity,Purchase Price,Current Value,Purchase Date,Notes
Apple Inc.,stock,AAPL,10,150.00,155.00,2024-01-01,Tech stock
Bitcoin,crypto,BTC,0.1,40000.00,45000.00,2024-02-01,Crypto investment`

  const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'budget-book-import-template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

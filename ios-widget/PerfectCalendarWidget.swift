import WidgetKit
import SwiftUI

// MARK: - Data Models

struct TodoItem: Codable, Identifiable {
    let id: String
    let title: String
    let type: String
    let completed: Bool
    let deadline: String?
    let specificDate: String?
    let createdAt: String?
    let recurringDay: String?
    let monthlyRecurringDay: Int?
    let dateRangeStart: String?
    let dateRangeEnd: String?
}

struct BudgetItem: Codable, Identifiable {
    let id: String
    let title: String
    let money: Int
    let date: String
    let type: String
    let category: String
    let account: String?
}

// MARK: - Data Provider

struct DataProvider {
    static let appGroup = "group.com.perfectcalendar.app"

    private static func defaults() -> UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    private static func loadJSON<T: Decodable>(_ key: String) -> T? {
        guard let defaults = defaults(),
              let jsonString = defaults.string(forKey: key),
              let data = jsonString.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    static func loadTodos() -> [TodoItem] {
        loadJSON("widget_todos") ?? []
    }

    static func loadBudgets() -> [BudgetItem] {
        loadJSON("widget_budgets") ?? []
    }

    static func loadAccounts() -> [String] {
        loadJSON("widget_accounts") ?? []
    }

    static func loadAccountBalances() -> [String: Int] {
        loadJSON("widget_account_balances") ?? [:]
    }

    static func loadMonthlyGoals() -> [String: Int] {
        loadJSON("widget_monthly_goals") ?? [:]
    }
}

// MARK: - Timeline

struct CalendarEntry: TimelineEntry {
    let date: Date
    let todos: [TodoItem]
    let budgets: [BudgetItem]
    let accounts: [String]
    let accountBalances: [String: Int]
    let monthlyGoals: [String: Int]
}

struct CalendarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> CalendarEntry {
        CalendarEntry(date: Date(), todos: [], budgets: [], accounts: [], accountBalances: [:], monthlyGoals: [:])
    }

    func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> CalendarEntry {
        CalendarEntry(
            date: Date(),
            todos: DataProvider.loadTodos(),
            budgets: DataProvider.loadBudgets(),
            accounts: DataProvider.loadAccounts(),
            accountBalances: DataProvider.loadAccountBalances(),
            monthlyGoals: DataProvider.loadMonthlyGoals()
        )
    }
}

// MARK: - Helper Functions

func formatKoreanCurrency(_ amount: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    return (formatter.string(from: NSNumber(value: amount)) ?? "0") + "원"
}

func daysUntil(_ dateString: String) -> Int {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    guard let targetDate = formatter.date(from: dateString) else { return 999 }
    let cal = Calendar.current
    let today = cal.startOfDay(for: Date())
    let target = cal.startOfDay(for: targetDate)
    return cal.dateComponents([.day], from: today, to: target).day ?? 999
}

func todayString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
}

// MARK: - Progress Bar (matches Android 20-block bar)

enum BlockColor {
    case green, orange, red, gray

    var color: Color {
        switch self {
        case .green: return Color(red: 0.30, green: 0.69, blue: 0.31)
        case .orange: return Color(red: 1.0, green: 0.60, blue: 0.0)
        case .red: return Color(red: 0.96, green: 0.26, blue: 0.21)
        case .gray: return Color(red: 0.88, green: 0.88, blue: 0.88)
        }
    }
}

struct TodoProgressInfo {
    let hasProgress: Bool
    let blocks: [BlockColor]
    let daysLeft: Int
    let label: String
}

func calculateTodoProgress(_ todo: TodoItem) -> TodoProgressInfo {
    let totalBlocks = 20
    let today = todayString()

    var targetDateStr: String? = nil
    var label = ""

    switch todo.type {
    case "DEADLINE":
        targetDateStr = todo.deadline
        label = "마감"
    case "SPECIFIC":
        targetDateStr = todo.specificDate
        label = "당일"
    case "DATE_RANGE":
        if let start = todo.dateRangeStart, let end = todo.dateRangeEnd {
            if today < start {
                targetDateStr = start
                label = "시작"
            } else {
                targetDateStr = end
                label = "종료"
            }
        }
    default:
        return TodoProgressInfo(hasProgress: false, blocks: [], daysLeft: 0, label: "")
    }

    guard let target = targetDateStr else {
        return TodoProgressInfo(hasProgress: false, blocks: [], daysLeft: 0, label: "")
    }

    let daysLeft = max(0, daysUntil(target))

    let blockColor: BlockColor
    if daysLeft <= 1 {
        blockColor = .red
    } else if daysLeft <= 5 {
        blockColor = .orange
    } else {
        blockColor = .green
    }

    let filledBlocks = min(daysLeft, totalBlocks)
    var blocks: [BlockColor] = []
    for i in 0..<totalBlocks {
        blocks.append(i < filledBlocks ? blockColor : .gray)
    }

    return TodoProgressInfo(hasProgress: true, blocks: blocks, daysLeft: daysLeft, label: label)
}

// MARK: - Progress Bar View

struct ProgressBarView: View {
    let blocks: [BlockColor]

    var body: some View {
        HStack(spacing: 1) {
            ForEach(0..<blocks.count, id: \.self) { i in
                RoundedRectangle(cornerRadius: 1.5)
                    .fill(blocks[i].color)
                    .frame(height: 6)
            }
        }
    }
}

// MARK: - Todo Card View (matches Android TodoCard)

struct TodoCardView: View {
    let todo: TodoItem

    var body: some View {
        let progress = calculateTodoProgress(todo)

        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text(todo.title)
                    .font(.system(size: 13))
                    .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))
                    .lineLimit(1)
                Spacer()
            }

            if progress.hasProgress {
                ProgressBarView(blocks: progress.blocks)

                Text(progress.daysLeft == 0
                     ? "오늘 \(progress.label)"
                     : "\(progress.daysLeft)일 뒤 \(progress.label)")
                    .font(.system(size: 10))
                    .foregroundColor(progress.daysLeft <= 3
                        ? Color(red: 0.96, green: 0.26, blue: 0.21)
                        : .gray)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Color.white)
        .cornerRadius(10)
    }
}

// MARK: - Todo Section View

struct TodoSectionView: View {
    let todos: [TodoItem]
    let maxItems: Int

    var activeTodos: [TodoItem] {
        todos
            .filter { !$0.completed && ($0.type == "DEADLINE" || $0.type == "SPECIFIC" || $0.type == "DATE_RANGE") }
            .sorted {
                let a = $0.deadline ?? $0.specificDate ?? $0.dateRangeStart ?? ""
                let b = $1.deadline ?? $1.specificDate ?? $1.dateRangeStart ?? ""
                return a < b
            }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("✅ 할 일")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))
                .padding(.bottom, 2)

            if activeTodos.isEmpty {
                Text("할 일이 없습니다")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 8)
            } else {
                ForEach(Array(activeTodos.prefix(maxItems))) { todo in
                    TodoCardView(todo: todo)
                }
            }
        }
    }
}

// MARK: - Account Balance View (matches Android BudgetContent)

struct AccountBalanceSectionView: View {
    let budgets: [BudgetItem]
    let accounts: [String]
    let accountBalances: [String: Int]
    let monthlyGoals: [String: Int]

    struct AccountEntry {
        let name: String
        let balance: Int
    }

    var accountEntries: [AccountEntry] {
        let defaultAccount = accounts.first ?? "기본"
        return accounts.map { account in
            let initial = accountBalances[account] ?? 0
            var balance = initial
            for b in budgets {
                let budgetAccount = b.account ?? defaultAccount
                guard budgetAccount == account else { continue }
                if b.type == "INCOME" {
                    balance += abs(b.money)
                } else {
                    balance -= abs(b.money)
                }
            }
            return AccountEntry(name: account, balance: balance)
        }
    }

    var goalRemaining: Int? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        let yearMonth = formatter.string(from: Date())
        guard let goal = monthlyGoals[yearMonth], goal > 0 else { return nil }
        let monthPrefix = yearMonth + "-"
        let expense = budgets
            .filter { $0.type == "EXPENSE" && $0.date.hasPrefix(monthPrefix) }
            .reduce(0) { $0 + abs($1.money) }
        return goal - expense
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let remaining = goalRemaining {
                HStack {
                    Text("목표 잔여")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.gray)
                    Spacer()
                    Text(formatKoreanCurrency(remaining))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(remaining >= 0
                            ? Color(red: 0.22, green: 0.56, blue: 0.24)
                            : Color(red: 0.83, green: 0.18, blue: 0.18))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(remaining >= 0
                    ? Color(red: 0.91, green: 0.96, blue: 0.91)
                    : Color(red: 1.0, green: 0.92, blue: 0.93))
                .cornerRadius(10)
            }

            Text("💰 통장별 잔액")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))
                .padding(.bottom, 2)

            if accountEntries.isEmpty {
                Text("등록된 통장이 없습니다")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 8)
            } else {
                ForEach(accountEntries, id: \.name) { item in
                    HStack {
                        Text(item.name)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))
                        Spacer()
                        Text(formatKoreanCurrency(item.balance))
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(item.balance >= 0
                                ? Color(red: 0.30, green: 0.69, blue: 0.31)
                                : Color(red: 0.96, green: 0.26, blue: 0.21))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white)
                    .cornerRadius(10)
                }
            }
        }
    }
}

// MARK: - Widget View

struct CalendarWidgetView: View {
    let entry: CalendarEntry
    @Environment(\.widgetFamily) var family

    var maxTodoItems: Int {
        switch family {
        case .systemLarge: return 5
        case .systemMedium: return 2
        default: return 1
        }
    }

    var body: some View {
        Link(destination: URL(string: "perfectcalendar://")!) {
            VStack(alignment: .leading, spacing: 6) {
                TodoSectionView(todos: entry.todos, maxItems: maxTodoItems)

                if family == .systemLarge {
                    Divider()
                        .padding(.vertical, 2)
                }

                AccountBalanceSectionView(
                    budgets: entry.budgets,
                    accounts: entry.accounts,
                    accountBalances: entry.accountBalances,
                    monthlyGoals: entry.monthlyGoals
                )

                Spacer(minLength: 0)
            }
            .padding(4)
        }
    }
}

// MARK: - Widget Configuration

struct PerfectCalendarWidget: Widget {
    let kind = "PerfectCalendarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarTimelineProvider()) { entry in
            if #available(iOS 17.0, *) {
                CalendarWidgetView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                CalendarWidgetView(entry: entry)
                    .padding()
                    .background(Color(UIColor.systemBackground))
            }
        }
        .configurationDisplayName("PerfectCalendar")
        .description("할 일과 가계부를 한눈에")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Widget Bundle

@main
struct PerfectCalendarWidgetBundle: WidgetBundle {
    var body: some Widget {
        PerfectCalendarWidget()
    }
}

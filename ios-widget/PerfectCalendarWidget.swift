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

    static func loadTodos() -> [TodoItem] {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let jsonString = defaults.string(forKey: "widget_todos"),
              let data = jsonString.data(using: .utf8) else {
            return []
        }
        return (try? JSONDecoder().decode([TodoItem].self, from: data)) ?? []
    }

    static func loadBudgets() -> [BudgetItem] {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let jsonString = defaults.string(forKey: "widget_budgets"),
              let data = jsonString.data(using: .utf8) else {
            return []
        }
        return (try? JSONDecoder().decode([BudgetItem].self, from: data)) ?? []
    }
}

// MARK: - Timeline

struct CalendarEntry: TimelineEntry {
    let date: Date
    let todos: [TodoItem]
    let budgets: [BudgetItem]
}

struct CalendarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> CalendarEntry {
        CalendarEntry(date: Date(), todos: [], budgets: [])
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
            budgets: DataProvider.loadBudgets()
        )
    }
}

// MARK: - Helper Functions

func currentYearMonth() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM"
    return formatter.string(from: Date())
}

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

// MARK: - Todo Section View

struct TodoSectionView: View {
    let todos: [TodoItem]
    let maxItems: Int

    var activeTodos: [TodoItem] {
        todos
            .filter { !$0.completed && ($0.type == "DEADLINE" || $0.type == "SPECIFIC") }
            .sorted {
                let a = $0.deadline ?? $0.specificDate ?? ""
                let b = $1.deadline ?? $1.specificDate ?? ""
                return a < b
            }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("📋 할 일")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color(red: 0.2, green: 0.2, blue: 0.2))

            if activeTodos.isEmpty {
                Text("마감 할 일이 없습니다")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 4)
            } else {
                ForEach(Array(activeTodos.prefix(maxItems))) { todo in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 6, height: 6)
                        Text(todo.title)
                            .font(.system(size: 13))
                            .lineLimit(1)
                        Spacer()
                        if let deadline = todo.deadline {
                            let days = daysUntil(deadline)
                            Text(days == 0 ? "오늘" : "\(days)일")
                                .font(.system(size: 11))
                                .foregroundColor(days <= 3 ? .red : .gray)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }
}

// MARK: - Budget Summary View

struct BudgetSummaryView: View {
    let budgets: [BudgetItem]

    var monthlyIncome: Int {
        let ym = currentYearMonth()
        return budgets.filter { $0.date.hasPrefix(ym) && $0.type == "INCOME" }
            .reduce(0) { $0 + $1.money }
    }

    var monthlyExpense: Int {
        let ym = currentYearMonth()
        return budgets.filter { $0.date.hasPrefix(ym) && $0.type == "EXPENSE" }
            .reduce(0) { $0 + $1.money }
    }

    var body: some View {
        HStack(spacing: 12) {
            HStack(spacing: 2) {
                Text("💰")
                    .font(.system(size: 11))
                Text("+\(formatKoreanCurrency(monthlyIncome))")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(red: 0.30, green: 0.69, blue: 0.31))
            }
            HStack(spacing: 2) {
                Text("-\(formatKoreanCurrency(monthlyExpense))")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(red: 0.96, green: 0.26, blue: 0.21))
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
        case .systemLarge: return 8
        case .systemMedium: return 3
        default: return 2
        }
    }

    var body: some View {
        Link(destination: URL(string: "perfectcalendar://")!) {
            VStack(alignment: .leading, spacing: 8) {
                TodoSectionView(todos: entry.todos, maxItems: maxTodoItems)
                Spacer()
                BudgetSummaryView(budgets: entry.budgets)
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

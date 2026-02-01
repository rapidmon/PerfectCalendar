import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { loadTodos, loadBudgets, saveTodos, loadAccounts, loadAccountBalances } from '../utils/storage';
import CombinedWidgetScreen, { WidgetTab } from './CombinedWidgetScreen';

const WIDGET_TAB_KEY = '@widget_active_tab';

async function getActiveTab(): Promise<WidgetTab> {
    try {
        const tab = await AsyncStorage.getItem(WIDGET_TAB_KEY);
        return (tab === 'budget') ? 'budget' : 'todo';
    } catch {
        return 'todo';
    }
}

async function setActiveTab(tab: WidgetTab): Promise<void> {
    try {
        await AsyncStorage.setItem(WIDGET_TAB_KEY, tab);
    } catch {}
}

async function buildCombinedWidget(tab?: WidgetTab) {
    const [todos, budgets, savedTab, accounts, accountBalances] = await Promise.all([
        loadTodos(),
        loadBudgets(),
        tab ? Promise.resolve(tab) : getActiveTab(),
        loadAccounts(),
        loadAccountBalances(),
    ]);
    const activeTab = tab ?? savedTab;
    return React.createElement(CombinedWidgetScreen, {
        todos,
        budgets,
        activeTab,
        accounts,
        accountInitialBalances: accountBalances,
    });
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const { widgetAction, renderWidget, clickAction, clickActionData } = props;

    switch (widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED': {
            const widget = await buildCombinedWidget();
            renderWidget(widget);
            break;
        }

        case 'WIDGET_CLICK': {
            if (clickAction === 'SWITCH_TAB' && clickActionData?.tab) {
                const tab = clickActionData.tab as WidgetTab;
                await setActiveTab(tab);
                const widget = await buildCombinedWidget(tab);
                renderWidget(widget);
            } else if (clickAction === 'COMPLETE_TODO' && clickActionData?.todoId) {
                const todos = await loadTodos();
                const updated = todos.map(t =>
                    t.id === (clickActionData.todoId as string) ? { ...t, completed: true } : t
                );
                await saveTodos(updated);
                const widget = await buildCombinedWidget('todo');
                renderWidget(widget);
            } else if (clickAction === 'DELETE_TODO' && clickActionData?.todoId) {
                const todos = await loadTodos();
                const updated = todos.filter(t => t.id !== (clickActionData.todoId as string));
                await saveTodos(updated);
                const widget = await buildCombinedWidget('todo');
                renderWidget(widget);
            } else if (clickAction === 'OPEN_APP' || clickAction === 'ADD_BUDGET') {
                Linking.openURL('perfectcalendar://');
                const widget = await buildCombinedWidget();
                renderWidget(widget);
            }
            break;
        }

        case 'WIDGET_DELETED':
        default:
            break;
    }
}

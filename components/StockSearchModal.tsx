import React, { useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StockSearchResult } from '../types/investment';
import { searchStocks } from '../services/stockService';

interface StockSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (stock: StockSearchResult) => void;
}

export default function StockSearchModal({
    visible,
    onClose,
    onSelect,
}: StockSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StockSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState<'ALL' | 'KOREA' | 'US'>('ALL');

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const searchResults = await searchStocks(query, searchType);
            setResults(searchResults);
        } catch (error) {
            console.error('검색 실패:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query, searchType]);

    const handleSelect = (stock: StockSearchResult) => {
        onSelect(stock);
        handleClose();
    };

    const handleClose = () => {
        setQuery('');
        setResults([]);
        onClose();
    };

    const renderItem = ({ item }: { item: StockSearchResult }) => {
        const isKorea = item.type === 'KOREA_STOCK';
        const flag = isKorea ? '🇰🇷' : '🇺🇸';

        return (
            <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
            >
                <Text style={styles.flag}>{flag}</Text>
                <View style={styles.stockInfo}>
                    <Text style={styles.stockName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.stockTicker}>
                        {item.ticker} • {item.market}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>종목 검색</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 시장 선택 */}
                    <View style={styles.typeContainer}>
                        {(['ALL', 'KOREA', 'US'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeButton,
                                    searchType === type && styles.typeButtonSelected,
                                ]}
                                onPress={() => setSearchType(type)}
                            >
                                <Text
                                    style={[
                                        styles.typeText,
                                        searchType === type && styles.typeTextSelected,
                                    ]}
                                >
                                    {type === 'ALL' ? '전체' : type === 'KOREA' ? '한국' : '미국'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 검색 입력 */}
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="종목명 또는 코드 입력"
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSearch}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                        >
                            <Text style={styles.searchButtonText}>검색</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 결과 목록 */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                        </View>
                    ) : results.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {query ? '검색 결과가 없습니다' : '종목을 검색하세요'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            renderItem={renderItem}
                            keyExtractor={(item) => `${item.type}-${item.ticker}`}
                            showsVerticalScrollIndicator={false}
                            style={styles.resultList}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        fontSize: 20,
        color: '#999',
        padding: 4,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    typeButtonSelected: {
        backgroundColor: '#E3F2FD',
    },
    typeText: {
        fontSize: 14,
        color: '#666',
    },
    typeTextSelected: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    resultList: {
        maxHeight: 400,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    flag: {
        fontSize: 24,
        marginRight: 12,
    },
    stockInfo: {
        flex: 1,
    },
    stockName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    stockTicker: {
        fontSize: 13,
        color: '#888',
    },
});

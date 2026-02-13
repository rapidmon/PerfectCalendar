import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Investment, StockSearchResult } from '../types/investment';
import { searchStocks } from '../services/stockService';

interface AddInvestmentModalProps {
    visible: boolean;
    editingInvestment?: Investment | null;
    onClose: () => void;
    onSave: (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function AddInvestmentModal({
    visible,
    editingInvestment,
    onClose,
    onSave,
}: AddInvestmentModalProps) {
    const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (editingInvestment) {
            setSelectedStock({
                ticker: editingInvestment.ticker,
                name: editingInvestment.name,
                market: editingInvestment.market,
                type: editingInvestment.type,
            });
            setSearchQuery(editingInvestment.name);
            setQuantity(String(editingInvestment.quantity));
            setAveragePrice(String(editingInvestment.averagePrice));
        } else {
            resetForm();
        }
    }, [editingInvestment, visible]);

    const resetForm = () => {
        setSelectedStock(null);
        setSearchQuery('');
        setSearchResults([]);
        setQuantity('');
        setAveragePrice('');
    };

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);

        // 종목 선택 상태에서 텍스트 변경하면 선택 해제
        if (selectedStock && text !== selectedStock.name) {
            setSelectedStock(null);
        }

        if (searchTimer.current) clearTimeout(searchTimer.current);

        if (!text.trim()) {
            setSearchResults([]);
            return;
        }

        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchStocks(text);
                setSearchResults(results);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);
    }, [selectedStock]);

    const handleStockSelect = (stock: StockSearchResult) => {
        setSelectedStock(stock);
        setSearchQuery(stock.name);
        setSearchResults([]);
    };

    const handleSave = () => {
        if (!selectedStock) return;

        const qty = parseInt(quantity, 10);
        const price = parseFloat(averagePrice);

        if (isNaN(qty) || qty <= 0) return;
        if (isNaN(price) || price <= 0) return;

        const currency = selectedStock.type === 'KOREA_STOCK' ? 'KRW' : 'USD';

        onSave({
            type: selectedStock.type,
            ticker: selectedStock.ticker,
            name: selectedStock.name,
            market: selectedStock.market,
            quantity: qty,
            averagePrice: price,
            currency,
        });

        handleClose();
    };

    const handleClose = () => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        resetForm();
        onClose();
    };

    const handleNumberInput = (text: string, setter: (value: string) => void) => {
        setter(text.replace(/[^0-9]/g, ''));
    };

    const handlePriceInput = (text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts.length === 2 && parts[1].length > 2) return;
        setAveragePrice(cleaned);
    };

    const isValid = () => {
        if (!selectedStock) return false;
        const qty = parseInt(quantity, 10);
        const price = parseFloat(averagePrice);
        return !isNaN(qty) && qty > 0 && !isNaN(price) && price > 0;
    };

    const isKorea = selectedStock?.type === 'KOREA_STOCK';
    const currencySymbol = isKorea ? '₩' : '$';
    const showResults = searchResults.length > 0 && !selectedStock;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {editingInvestment ? '투자 수정' : '투자 추가'}
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* 종목 검색 */}
                        <Text style={styles.label}>종목 (🇰🇷 한국 / 🇺🇸 미국)</Text>
                        <View>
                            <TextInput
                                style={[
                                    styles.input,
                                    selectedStock && styles.inputSelected,
                                ]}
                                placeholder="종목명 또는 코드 입력"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                autoFocus={!editingInvestment}
                            />
                            {selectedStock && (
                                <View style={styles.selectedBadge}>
                                    <Text style={styles.selectedBadgeFlag}>
                                        {isKorea ? '🇰🇷' : '🇺🇸'}
                                    </Text>
                                    <Text style={styles.selectedBadgeText}>
                                        {selectedStock.ticker} • {selectedStock.market}
                                    </Text>
                                    <TouchableOpacity onPress={() => { setSelectedStock(null); setSearchQuery(''); }}>
                                        <Text style={styles.selectedBadgeClear}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* 검색 중 표시 */}
                        {searching && (
                            <View style={styles.searchingRow}>
                                <ActivityIndicator size="small" color="#4A90E2" />
                                <Text style={styles.searchingText}>검색 중...</Text>
                            </View>
                        )}

                        {/* 검색 결과 드롭다운 */}
                        {showResults && (
                            <ScrollView style={styles.resultsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                {searchResults.map((item) => {
                                    const flag = item.type === 'KOREA_STOCK' ? '🇰🇷' : '🇺🇸';
                                    return (
                                        <TouchableOpacity
                                            key={`${item.type}-${item.ticker}`}
                                            style={styles.resultItem}
                                            onPress={() => handleStockSelect(item)}
                                        >
                                            <Text style={styles.resultFlag}>{flag}</Text>
                                            <View style={styles.resultInfo}>
                                                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.resultTicker}>{item.ticker} • {item.market}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* 수량 */}
                        <Text style={styles.label}>보유 수량 (주)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="보유 수량 입력"
                            value={quantity}
                            onChangeText={(text) => handleNumberInput(text, setQuantity)}
                            keyboardType="numeric"
                        />

                        {/* 평균 매입가 */}
                        <Text style={styles.label}>평균 매입가 ({currencySymbol})</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="평균 매입가 입력"
                            value={averagePrice}
                            onChangeText={handlePriceInput}
                            keyboardType="decimal-pad"
                        />

                        {/* 매입금액 미리보기 */}
                        {isValid() && (
                            <View style={styles.previewContainer}>
                                <Text style={styles.previewLabel}>총 매입금액</Text>
                                <Text style={styles.previewValue}>
                                    {currencySymbol}
                                    {(parseInt(quantity) * parseFloat(averagePrice)).toLocaleString(
                                        undefined,
                                        { minimumFractionDigits: isKorea ? 0 : 2, maximumFractionDigits: isKorea ? 0 : 2 }
                                    )}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, !isValid() && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!isValid()}
                        >
                            <Text style={styles.saveButtonText}>
                                {editingInvestment ? '수정' : '추가'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 4,
    },
    inputSelected: {
        borderColor: '#4A90E2',
        backgroundColor: '#F8FBFF',
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 4,
    },
    selectedBadgeFlag: {
        fontSize: 14,
        marginRight: 6,
    },
    selectedBadgeText: {
        fontSize: 13,
        color: '#4A90E2',
        fontWeight: '600',
        flex: 1,
    },
    selectedBadgeClear: {
        fontSize: 16,
        color: '#999',
        paddingLeft: 8,
    },
    searchingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
    },
    searchingText: {
        fontSize: 13,
        color: '#999',
    },
    resultsList: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 8,
        maxHeight: 200,
        overflow: 'hidden',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultFlag: {
        fontSize: 20,
        marginRight: 10,
    },
    resultInfo: {
        flex: 1,
    },
    resultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    resultTicker: {
        fontSize: 12,
        color: '#888',
    },
    previewContainer: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    previewLabel: {
        fontSize: 14,
        color: '#666',
    },
    previewValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Investment, StockSearchResult } from '../types/investment';
import StockSearchModal from './StockSearchModal';

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
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        if (editingInvestment) {
            setSelectedStock({
                ticker: editingInvestment.ticker,
                name: editingInvestment.name,
                market: editingInvestment.market,
                type: editingInvestment.type,
            });
            setQuantity(String(editingInvestment.quantity));
            setAveragePrice(String(editingInvestment.averagePrice));
        } else {
            resetForm();
        }
    }, [editingInvestment, visible]);

    const resetForm = () => {
        setSelectedStock(null);
        setQuantity('');
        setAveragePrice('');
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
        resetForm();
        onClose();
    };

    const handleStockSelect = (stock: StockSearchResult) => {
        setSelectedStock(stock);
        setShowSearchModal(false);
    };

    const handleNumberInput = (text: string, setter: (value: string) => void) => {
        setter(text.replace(/[^0-9]/g, ''));
    };

    const handlePriceInput = (text: string) => {
        // 소수점 허용 (미국 주식)
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

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {editingInvestment ? '투자 수정' : '투자 추가'}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* 종목 선택 */}
                            <Text style={styles.label}>종목</Text>
                            <TouchableOpacity
                                style={styles.stockSelectButton}
                                onPress={() => setShowSearchModal(true)}
                            >
                                {selectedStock ? (
                                    <View style={styles.selectedStock}>
                                        <Text style={styles.selectedStockFlag}>
                                            {isKorea ? '🇰🇷' : '🇺🇸'}
                                        </Text>
                                        <View style={styles.selectedStockInfo}>
                                            <Text style={styles.selectedStockName}>
                                                {selectedStock.name}
                                            </Text>
                                            <Text style={styles.selectedStockTicker}>
                                                {selectedStock.ticker} • {selectedStock.market}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={styles.stockSelectPlaceholder}>
                                        종목을 선택하세요
                                    </Text>
                                )}
                            </TouchableOpacity>

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
                </View>
            </Modal>

            <StockSearchModal
                visible={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onSelect={handleStockSelect}
            />
        </>
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
        marginBottom: 8,
    },
    stockSelectButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    stockSelectPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    selectedStock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedStockFlag: {
        fontSize: 24,
        marginRight: 10,
    },
    selectedStockInfo: {
        flex: 1,
    },
    selectedStockName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    selectedStockTicker: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
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

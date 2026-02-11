import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView
} from 'react-native';
import {
  isGroupConnected,
  createGroup,
  joinGroup,
  getCurrentGroupCode,
  getCurrentUserName,
  getGroupInfo,
  leaveGroup,
  ensureAuthenticated,
  uploadLocalBudgets,
  uploadLocalTodos,
  uploadLocalAccounts,
  uploadLocalCategories,
  subscribeToGroupAsync,
  Group
} from '../firebase';
import { useAppData } from '../contexts/AppDataContext';

type ScreenMode = 'loading' | 'not_connected' | 'connected';

// 소유자별 색상 (멤버 구분용)
const OWNER_COLORS = [
    '#4A90E2', // 파랑
    '#E91E63', // 핑크
    '#9C27B0', // 보라
    '#FF9800', // 주황
    '#009688', // 청록
    '#795548', // 갈색
];

// uid를 기반으로 일관된 색상 인덱스 생성
const getOwnerColorIndex = (uid: string): number => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = ((hash << 5) - hash) + uid.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash) % OWNER_COLORS.length;
};

export default function TogetherScreen() {
  const { store, budgets, todos, accounts, accountBalances, categories, fixedCategories } = useAppData();
  const [mode, setMode] = useState<ScreenMode>('loading');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [userName, setUserName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadExisting, setUploadExisting] = useState(true);
  const [groupUnsubscribe, setGroupUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    checkConnectionStatus();
    return () => {
      groupUnsubscribe?.();
    };
  }, [groupUnsubscribe]);

  const checkConnectionStatus = async () => {
    try {
      await ensureAuthenticated();
      const connected = await isGroupConnected();

      if (connected) {
        const code = await getCurrentGroupCode();
        const name = await getCurrentUserName();
        if (code) {
          setGroupCode(code);
          setUserName(name || '');

          // 실시간 구독으로 멤버 목록 갱신
          const unsub = await subscribeToGroupAsync(
            (info) => setGroupInfo(info),
            (error) => console.error('Group subscribe error:', error)
          );
          setGroupUnsubscribe(() => unsub);
        }
        setMode('connected');
      } else {
        setMode('not_connected');
      }
    } catch (error) {
      console.error('Connection check error:', error);
      setMode('not_connected');
    }
  };

  const handleCreateGroup = async () => {
    if (!userName.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const code = await createGroup(userName.trim(), groupName.trim() || undefined);
      setGroupCode(code);

      // 실시간 구독으로 멤버 목록 갱신
      const unsub = await subscribeToGroupAsync(
        (info) => setGroupInfo(info),
        (error) => console.error('Group subscribe error:', error)
      );
      setGroupUnsubscribe(() => unsub);

      // Store에서 그룹 동기화 시작
      await store.startGroupSync();

      // 기존 데이터 업로드 (옵션 선택 시)
      if (uploadExisting && (budgets.length > 0 || todos.length > 0 || accounts.length > 0)) {
        let uploadMessage = '';

        if (budgets.length > 0) {
          const budgetData = budgets.map(b => ({
            money: b.money,
            date: b.date,
            type: b.type,
            category: b.category,
            account: b.account
          }));
          const budgetCount = await uploadLocalBudgets(budgetData);
          uploadMessage += `가계부 ${budgetCount}개`;
        }

        if (todos.length > 0) {
          const todoData = todos.map(t => ({
            title: t.title,
            type: t.type,
            completed: t.completed,
            recurringDay: t.recurringDay,
            monthlyRecurringDay: t.monthlyRecurringDay,
            deadline: t.deadline,
            specificDate: t.specificDate,
            dateRangeStart: t.dateRangeStart,
            dateRangeEnd: t.dateRangeEnd
          }));
          const todoCount = await uploadLocalTodos(todoData);
          if (uploadMessage) uploadMessage += ', ';
          uploadMessage += `할 일 ${todoCount}개`;
        }

        if (accounts.length > 0) {
          await uploadLocalAccounts(accounts, accountBalances);
          if (uploadMessage) uploadMessage += ', ';
          uploadMessage += `통장 ${accounts.length}개`;
        }

        if (categories.length > 0) {
          await uploadLocalCategories(categories, fixedCategories);
        }

        if (uploadMessage) {
          uploadMessage = `\n\n기존 데이터 업로드 완료: ${uploadMessage}`;
        }

        Alert.alert('공유 코드 생성 완료', `공유 코드: ${code}\n\n이 코드를 상대방에게 공유해주세요.${uploadMessage}`);
      } else {
        Alert.alert('공유 코드 생성 완료', `공유 코드: ${code}\n\n이 코드를 상대방에게 공유해주세요.`);
      }

      setMode('connected');
      setShowCreateInput(false);
    } catch (error) {
      console.error('Create group error:', error);
      Alert.alert('오류', '공유 코드 생성에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!userName.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (!inputCode.trim()) {
      Alert.alert('알림', '그룹 코드를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await joinGroup(inputCode.trim(), userName.trim());
      if (success) {
        setGroupCode(inputCode.trim().toUpperCase());

        // 실시간 구독으로 멤버 목록 갱신
        const unsub = await subscribeToGroupAsync(
          (info) => setGroupInfo(info),
          (error) => console.error('Group subscribe error:', error)
        );
        setGroupUnsubscribe(() => unsub);

        // Store에서 그룹 동기화 시작
        await store.startGroupSync();

        setMode('connected');
        setShowJoinInput(false);
        Alert.alert('참여 완료', '그룹에 성공적으로 참여했습니다.');
      } else {
        Alert.alert('오류', '존재하지 않는 그룹 코드입니다.');
      }
    } catch (error) {
      console.error('Join group error:', error);
      Alert.alert('오류', '그룹 참여에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      '그룹 나가기',
      '정말 그룹에서 나가시겠습니까?\n로컬 데이터는 유지되지만 동기화가 중단됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            groupUnsubscribe?.();
            setGroupUnsubscribe(null);
            await leaveGroup();
            await store.disconnectGroup();
            setGroupCode('');
            setGroupInfo(null);
            setMode('not_connected');
          }
        }
      ]
    );
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `함께 가계부/할 일을 관리해요!\n\n그룹 코드: ${groupCode}\n\nPerfectCalendar 앱에서 이 코드로 참여하세요.`
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (mode === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (mode === 'connected') {
    const memberCount = groupInfo?.members.length || 0;
    const memberNames = groupInfo?.memberNames ? Object.values(groupInfo.memberNames) : [];
    const displayGroupName = groupInfo?.name;

    return (
      <View style={styles.container}>
        <View style={styles.connectedCard}>
          <Text style={styles.connectedTitle}>
            {displayGroupName || '그룹 연결됨'}
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>공유 코드</Text>
            <Text style={styles.codeText}>{groupCode}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>내 이름</Text>
            <Text style={styles.infoValue}>{userName}</Text>
          </View>

          <View style={styles.memberSection}>
            <Text style={styles.infoLabel}>멤버 ({memberCount}명)</Text>
            <View style={styles.memberList}>
              {groupInfo?.members.map((uid) => {
                const name = groupInfo.memberNames?.[uid] || '알 수 없음';
                const color = OWNER_COLORS[getOwnerColorIndex(uid)];
                return (
                  <View key={uid} style={styles.memberItem}>
                    <View style={[styles.memberColorDot, { backgroundColor: color }]} />
                    <Text style={styles.memberName}>{name}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
            <Text style={styles.shareButtonText}>코드 공유하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Text style={styles.leaveButtonText}>그룹 나가기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoText}>
            가계부, 할 일, 통장이 실시간으로 동기화됩니다.
          </Text>
        </View>
      </View>
    );
  }

  // not_connected 상태
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>함께해요</Text>
        <Text style={styles.subtitle}>
          가족, 연인과 함께{'\n'}가계부와 할 일을 관리하세요
        </Text>
      </View>

      {!showCreateInput && !showJoinInput && (
        <>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowCreateInput(true)}
            >
              <Text style={styles.primaryButtonText}>공유 코드 만들기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowJoinInput(true)}
            >
              <Text style={styles.secondaryButtonText}>코드로 참여하기</Text>
            </TouchableOpacity>
          </View>

          {/* 사용 예시 섹션 */}
          <View style={styles.exampleSection}>
            <Text style={styles.exampleSectionTitle}>이렇게 사용해요</Text>

            <View style={styles.exampleCard}>
              <View style={styles.exampleIconContainer}>
                <Text style={styles.exampleIcon}>1</Text>
              </View>
              <View style={styles.exampleContent}>
                <Text style={styles.exampleTitle}>공유 코드 만들기</Text>
                <Text style={styles.exampleDesc}>
                  먼저 한 사람이 코드를 생성하고{'\n'}상대방에게 공유해요
                </Text>
              </View>
            </View>

            <View style={styles.exampleCard}>
              <View style={styles.exampleIconContainer}>
                <Text style={styles.exampleIcon}>2</Text>
              </View>
              <View style={styles.exampleContent}>
                <Text style={styles.exampleTitle}>코드로 참여하기</Text>
                <Text style={styles.exampleDesc}>
                  상대방은 받은 6자리 코드를{'\n'}입력해서 참여해요
                </Text>
              </View>
            </View>

            <View style={styles.exampleCard}>
              <View style={styles.exampleIconContainer}>
                <Text style={styles.exampleIcon}>3</Text>
              </View>
              <View style={styles.exampleContent}>
                <Text style={styles.exampleTitle}>실시간 동기화</Text>
                <Text style={styles.exampleDesc}>
                  가계부, 할 일, 통장이{'\n'}자동으로 공유돼요
                </Text>
              </View>
            </View>

          </View>
        </>
      )}

      {showCreateInput && (
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>공유 코드 만들기</Text>
          <TextInput
            style={styles.input}
            placeholder="그룹 이름 (예: 우리 가족, 선택사항)"
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="내 이름 (예: 남편, 엄마)"
            value={userName}
            onChangeText={setUserName}
          />
          {(budgets.length > 0 || todos.length > 0 || accounts.length > 0) && (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setUploadExisting(!uploadExisting)}
            >
              <View style={[styles.checkbox, uploadExisting && styles.checkboxChecked]}>
                {uploadExisting && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                기존 데이터 공유하기 (가계부 {budgets.length}개, 할 일 {todos.length}개, 통장 {accounts.length}개)
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.inputButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateInput(false);
                setUserName('');
                setGroupName('');
              }}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isProcessing && styles.disabledButton]}
              onPress={handleCreateGroup}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>만들기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showJoinInput && (
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>그룹 참여하기</Text>
          <TextInput
            style={styles.input}
            placeholder="내 이름 (예: 아내, 아빠)"
            value={userName}
            onChangeText={setUserName}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="그룹 코드 (6자리)"
            value={inputCode}
            onChangeText={(text) => setInputCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />
          <View style={styles.inputButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowJoinInput(false);
                setUserName('');
                setInputCode('');
              }}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isProcessing && styles.disabledButton]}
              onPress={handleJoinGroup}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>참여하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A90E2',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#4A90E2',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  connectedCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  connectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8F0',
  },
  memberSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8F0',
  },
  memberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  memberColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  leaveButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
  },
  syncInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  syncInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  exampleSection: {
    marginTop: 32,
  },
  exampleSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exampleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  exampleIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exampleContent: {
    flex: 1,
  },
  exampleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exampleDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
});

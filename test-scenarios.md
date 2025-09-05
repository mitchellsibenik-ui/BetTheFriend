# 🧪 CRITICAL TEST SCENARIOS FOR BETTHEFRIEND

## 🚨 HIGH PRIORITY TESTS

### 1. Friend Management Race Conditions
**Issue**: Multiple friend requests can be created simultaneously
**Test Steps**:
1. Open two browser tabs with different users
2. Both users try to send friend requests to each other at the same time
3. Check if duplicate friend requests are created
4. Verify only one friendship is established

**Expected**: Only one friendship should be created
**Actual Risk**: Duplicate friend requests or database errors

### 2. Bet Creation Balance Race Condition
**Issue**: Balance check happens outside transaction
**Test Steps**:
1. User has exactly $100 balance
2. User tries to place two $100 bets simultaneously
3. Check if both bets are created (should only allow one)
4. Verify balance is correctly deducted

**Expected**: Only one bet should be created, balance should be $0
**Actual Risk**: Both bets created, negative balance

### 3. Chat Notification Spam
**Issue**: localStorage-based notification tracking
**Test Steps**:
1. Open multiple browser tabs
2. Send a message in one tab
3. Check if notification appears in all tabs
4. Clear browser data and test again

**Expected**: Notification appears once per tab
**Actual Risk**: Multiple notifications or missing notifications

### 4. Hamburger Menu State Issues
**Issue**: Body scroll lock not properly cleaned up
**Test Steps**:
1. Open mobile menu
2. Navigate to different page while menu is open
3. Check if body scroll is still locked
4. Test with multiple rapid open/close actions

**Expected**: Body scroll should be restored
**Actual Risk**: Page remains unscrollable

### 5. Notification Counter Race Conditions
**Issue**: Multiple setTimeout calls for updates
**Test Steps**:
1. Accept a friend request
2. Rapidly perform multiple notification actions
3. Check if counter updates correctly
4. Test with network delays

**Expected**: Counter should update accurately
**Actual Risk**: Counter shows wrong values

## 🔍 MEDIUM PRIORITY TESTS

### 6. Form Validation Edge Cases
**Test Steps**:
1. Submit empty friend request form
2. Enter special characters in username
3. Try very long usernames (>50 characters)
4. Submit forms with only whitespace

### 7. Mobile Touch Target Issues
**Test Steps**:
1. Test on actual mobile device
2. Try to tap small buttons (chat, remove friend)
3. Test with different screen sizes
4. Check for accidental double-taps

### 8. Network Interruption Handling
**Test Steps**:
1. Start a bet creation process
2. Disable internet mid-process
3. Re-enable internet
4. Check if state is consistent

## ⚠️ CRITICAL RACE CONDITIONS TO TEST

1. **Balance Updates**: Multiple bet operations affecting balance
2. **Friend Status**: Friend removal while bet is being created
3. **Game State**: Game starting while bet is being placed
4. **Notification Updates**: Multiple notification actions simultaneously
5. **Chat Messages**: Messages being sent while room is being created

## 🎯 MOST LIKELY FAILURE POINTS

1. **Chat notification system** (newly implemented)
2. **Friend management race conditions**
3. **Bet creation balance validation**
4. **Mobile hamburger menu state**
5. **Notification counter updates**

## 📱 MOBILE-SPECIFIC TESTS

1. **Keyboard Overlap**: Input fields hidden by mobile keyboard
2. **Swipe Gestures**: Accidental swipes triggering actions
3. **Orientation Changes**: Layout breaking on rotation
4. **Viewport Issues**: Content cut off on small screens
5. **Touch Targets**: Buttons too small for finger taps

## 🔧 TESTING METHODOLOGY

1. **Rapid Clicking**: Click buttons multiple times quickly
2. **Network Interruption**: Disable internet during operations
3. **Concurrent Users**: Test with multiple browser tabs/users
4. **Edge Values**: Test with minimum/maximum valid inputs
5. **State Transitions**: Test during loading states and transitions

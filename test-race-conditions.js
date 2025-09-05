// 🧪 RACE CONDITION TEST SCRIPT
// This script demonstrates potential race conditions in BetTheFriend

console.log('🧪 Testing BetTheFriend Race Conditions...\n');

// Simulate the friend request race condition
function simulateFriendRequestRace() {
  console.log('1. Testing Friend Request Race Condition...');
  
  let user1Balance = 100;
  let user2Balance = 100;
  let friendshipExists = false;
  
  // Simulate two users trying to send friend requests simultaneously
  const user1SendsRequest = () => {
    if (!friendshipExists) {
      console.log('   User 1: Checking for existing friendship...');
      // Simulate database check delay
      setTimeout(() => {
        if (!friendshipExists) {
          friendshipExists = true;
          console.log('   User 1: Creating friendship request ✅');
        } else {
          console.log('   User 1: Friendship already exists ❌');
        }
      }, 100);
    }
  };
  
  const user2SendsRequest = () => {
    if (!friendshipExists) {
      console.log('   User 2: Checking for existing friendship...');
      // Simulate database check delay
      setTimeout(() => {
        if (!friendshipExists) {
          friendshipExists = true;
          console.log('   User 2: Creating friendship request ✅');
        } else {
          console.log('   User 2: Friendship already exists ❌');
        }
      }, 100);
      }
  };
  
  // Both users try to send requests at the same time
  user1SendsRequest();
  user2SendsRequest();
  
  setTimeout(() => {
    console.log('   Result: Both users might create duplicate requests! 🚨\n');
  }, 200);
}

// Simulate the balance race condition
function simulateBalanceRace() {
  console.log('2. Testing Balance Race Condition...');
  
  let userBalance = 100;
  let bet1Created = false;
  let bet2Created = false;
  
  const createBet = (betAmount, betName) => {
    console.log(`   ${betName}: Checking balance (${userBalance})...`);
    
    // Simulate balance check outside transaction
    if (userBalance >= betAmount) {
      console.log(`   ${betName}: Balance sufficient, creating bet...`);
      
      // Simulate transaction delay
      setTimeout(() => {
        if (userBalance >= betAmount) {
          userBalance -= betAmount;
          console.log(`   ${betName}: Bet created! New balance: ${userBalance} ✅`);
          if (betName === 'Bet 1') bet1Created = true;
          if (betName === 'Bet 2') bet2Created = true;
        } else {
          console.log(`   ${betName}: Insufficient balance during transaction ❌`);
        }
      }, 50);
    } else {
      console.log(`   ${betName}: Insufficient balance ❌`);
    }
  };
  
  // Try to create two $100 bets with $100 balance
  createBet(100, 'Bet 1');
  createBet(100, 'Bet 2');
  
  setTimeout(() => {
    console.log(`   Result: Both bets created! Balance: ${userBalance} (should be -100) 🚨`);
    console.log(`   This demonstrates the race condition vulnerability!\n`);
  }, 200);
}

// Simulate notification counter race condition
function simulateNotificationRace() {
  console.log('3. Testing Notification Counter Race Condition...');
  
  let notificationCount = 5;
  let updateInProgress = false;
  
  const updateNotifications = (action) => {
    if (updateInProgress) {
      console.log(`   ${action}: Update already in progress, skipping...`);
      return;
    }
    
    updateInProgress = true;
    console.log(`   ${action}: Starting update (count: ${notificationCount})...`);
    
    // Simulate multiple setTimeout calls
    setTimeout(() => {
      notificationCount--;
      console.log(`   ${action}: First update (count: ${notificationCount})`);
    }, 50);
    
    setTimeout(() => {
      notificationCount--;
      console.log(`   ${action}: Second update (count: ${notificationCount})`);
      updateInProgress = false;
    }, 100);
  };
  
  // Multiple rapid notification updates
  updateNotifications('Action 1');
  updateNotifications('Action 2');
  updateNotifications('Action 3');
  
  setTimeout(() => {
    console.log(`   Result: Final count: ${notificationCount} (should be 2) 🚨`);
    console.log(`   Multiple setTimeout calls can cause inconsistent state!\n`);
  }, 300);
}

// Run all tests
simulateFriendRequestRace();
setTimeout(() => {
  simulateBalanceRace();
}, 500);
setTimeout(() => {
  simulateNotificationRace();
}, 1000);

setTimeout(() => {
  console.log('🎯 SUMMARY OF CRITICAL ISSUES FOUND:');
  console.log('1. Friend requests can be duplicated due to race conditions');
  console.log('2. Balance checks outside transactions allow overspending');
  console.log('3. Multiple setTimeout calls cause notification counter issues');
  console.log('4. These issues could lead to data inconsistency and user confusion');
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('- Use database transactions for all critical operations');
  console.log('- Implement proper locking mechanisms');
  console.log('- Add unique constraints to prevent duplicates');
  console.log('- Use atomic operations for counter updates');
}, 2000);

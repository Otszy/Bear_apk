import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  // Don't throw error in development, just log it
}

export const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey) : null

// Helper function to get current user ID from Telegram
export function getCurrentUserId() {
  try {
    const tg = window?.Telegram?.WebApp
    if (!tg?.initDataUnsafe?.user?.id) {
      console.warn('No Telegram user data available')
      return null
    }
    return tg.initDataUnsafe.user.id
  } catch (error) {
    console.error('Failed to get current user ID:', error)
    return null
  }
}

// Database operations
export const db = {
  // User operations
  async getOrCreateUser(telegramUser) {
    if (!supabase) {
      console.error('Supabase not initialized')
      return { 
        id: telegramUser?.id || 0, 
        balance: 0, 
        total_earned: 0, 
        referral_code: 'DEMO',
        username: telegramUser?.username || 'demo'
      }
    }

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', telegramUser.id)
        .single()

      if (existingUser && !fetchError) {
        return existingUser
      }

      // Create new user with referral code
      const referralCode = `REF${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          referral_code: referralCode
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        return { 
          id: telegramUser.id, 
          balance: 0, 
          total_earned: 0, 
          referral_code: 'DEMO',
          username: telegramUser.username
        }
      }

      return newUser
    } catch (error) {
      console.error('Database error in getOrCreateUser:', error)
      return { 
        id: telegramUser?.id || 0, 
        balance: 0, 
        total_earned: 0, 
        referral_code: 'DEMO',
        username: telegramUser?.username || 'demo'
      }
    }
  },

  // Daily claims
  async getDailyClaimStatus(userId) {
    if (!supabase) {
      return { canClaim: false, nextDay: 1, alreadyClaimed: false }
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: todayClaim } = await supabase
        .from('daily_claims')
        .select('*')
        .eq('user_id', userId)
        .eq('claim_date', today)
        .single()

      const { data: allClaims } = await supabase
        .from('daily_claims')
        .select('day_number')
        .eq('user_id', userId)
        .order('day_number', { ascending: false })
        .limit(1)

      const lastDay = allClaims?.[0]?.day_number || 0
      const nextDay = Math.min(lastDay + 1, 9)
      
      return {
        canClaim: !todayClaim && nextDay <= 9,
        nextDay,
        alreadyClaimed: !!todayClaim
      }
    } catch (error) {
      console.error('Error getting daily claim status:', error)
      return { canClaim: false, nextDay: 1, alreadyClaimed: false }
    }
  },

  async claimDailyReward(userId) {
    if (!supabase) {
      throw new Error('Database not available')
    }

    try {
      const status = await this.getDailyClaimStatus(userId)
      if (!status.canClaim) {
        throw new Error('Already claimed today or completed all days')
      }

      const rewards = [0.002, 0.004, 0.006, 0.008, 0.01, 0.012, 0.014, 0.016, 0.018]
      const amount = rewards[status.nextDay - 1]
      const today = new Date().toISOString().split('T')[0]

      // Create daily claim record
      const { data: claim, error: claimError } = await supabase
        .from('daily_claims')
        .insert({
          user_id: userId,
          claim_date: today,
          day_number: status.nextDay,
          amount
        })
        .select()
        .single()

      if (claimError) throw claimError

      // Update user balance using the stored function
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_amount: amount,
        p_type: 'daily_claim',
        p_description: `Daily reward day ${status.nextDay}`,
        p_reference_id: claim.id
      })

      if (balanceError) throw balanceError

      return { amount, day: status.nextDay }
    } catch (error) {
      console.error('Error claiming daily reward:', error)
      throw error
    }
  },

  // Tasks
  async getTasks() {
    if (!supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting tasks:', error)
      return []
    }
  },

  async getUserTaskCompletions(userId) {
    if (!supabase) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('task_id, completed_at')
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user task completions:', error)
      return []
    }
  },

  async completeTask(userId, taskId, sessionData = null) {
    if (!supabase) {
      throw new Error('Database not available')
    }

    try {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError

      // Check if user already completed this task (for limited tasks)
      if (task.max_completions === 1) {
        const { data: existing } = await supabase
          .from('user_tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .single()

        if (existing) {
          throw new Error('Task already completed')
        }
      }

      // Complete the task
      const { data: completion, error: completionError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: userId,
          task_id: taskId,
          reward_amount: task.reward,
          session_data: sessionData
        })
        .select()
        .single()

      if (completionError) throw completionError

      // Update user balance
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_amount: task.reward,
        p_type: 'task_reward',
        p_description: `Task: ${task.title}`,
        p_reference_id: completion.id
      })

      if (balanceError) throw balanceError

      // Handle referral bonus (10% to referrer)
      const { data: user } = await supabase
        .from('users')
        .select('referred_by')
        .eq('id', userId)
        .single()

      if (user?.referred_by) {
        const referralBonus = task.reward * 0.1
        await supabase.rpc('update_user_balance', {
          p_user_id: user.referred_by,
          p_amount: referralBonus,
          p_type: 'referral_bonus',
          p_description: `Referral bonus from task: ${task.title}`,
          p_reference_id: completion.id
        })
      }

      return { reward: task.reward }
    } catch (error) {
      console.error('Error completing task:', error)
      throw error
    }
  },

  // Withdrawals
  async createWithdrawal(userId, amount, address, memo, network) {
    if (!supabase) {
      throw new Error('Database not available')
    }

    try {
      // Check user balance
      const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single()

      if (!user || user.balance < amount) {
        throw new Error('Insufficient balance')
      }

      // Create withdrawal request
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount,
          address,
          memo,
          network
        })
        .select()
        .single()

      if (withdrawalError) throw withdrawalError

      // Deduct from user balance
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        p_user_id: userId,
        p_amount: -amount,
        p_type: 'withdrawal',
        p_description: `Withdrawal to ${network}`,
        p_reference_id: withdrawal.id
      })

      if (balanceError) throw balanceError

      return withdrawal
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      throw error
    }
  },

  // Referrals
  async processReferral(referredUserId, referralCode) {
    if (!supabase || !referralCode) return

    try {
      // Find referrer by code
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (!referrer || referrer.id === referredUserId) return

      // Check if user is already referred
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', referredUserId)
        .single()

      if (existing) return

      // Create referral relationship
      await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: referredUserId
        })

      // Update referred user
      await supabase
        .from('users')
        .update({ referred_by: referrer.id })
        .eq('id', referredUserId)

      console.log('Referral processed successfully')
    } catch (error) {
      console.error('Error processing referral:', error)
    }
  },

  async getUserStats(userId) {
    if (!supabase) {
      console.warn('Database not available, returning demo stats');
      return { 
        balance: 0.012, 
        total_earned: 0.012, 
        referral_code: 'DEMO123', 
        referralCount: 0 
      };
    }

    try {
      console.log('Getting user stats for:', userId);
      const { data: user } = await supabase
        .from('users')
        .select('balance, total_earned, referral_code')
        .eq('id', userId)
        .single()

      const { data: referrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId)

      return {
        balance: user?.balance || 0,
        total_earned: user?.total_earned || 0,
        referral_code: user?.referral_code || 'DEMO',
        referralCount: referrals?.length || 0
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return { balance: 0, total_earned: 0, referral_code: 'DEMO', referralCount: 0 }
    }
  }
}
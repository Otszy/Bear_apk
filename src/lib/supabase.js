import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get current user ID from Telegram
export function getCurrentUserId() {
  try {
    const tg = window?.Telegram?.WebApp
    if (!tg?.initDataUnsafe?.user?.id) {
      throw new Error('No Telegram user data available')
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', telegramUser.id)
      .single()

    if (existingUser) {
      return existingUser
    }

    // Create new user with referral code
    const referralCode = `REF${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
    
    const { data: newUser, error } = await supabase
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

    if (error) throw error
    return newUser
  },

  // Daily claims
  async getDailyClaimStatus(userId) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data } = await supabase
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
      canClaim: !data && nextDay <= 9,
      nextDay,
      alreadyClaimed: !!data
    }
  },

  async claimDailyReward(userId) {
    const status = await this.getDailyClaimStatus(userId)
    if (!status.canClaim) {
      throw new Error('Already claimed today or completed all days')
    }

    const rewards = [0.002, 0.004, 0.006, 0.008, 0.01, 0.012, 0.014, 0.016, 0.018]
    const amount = rewards[status.nextDay - 1]
    const today = new Date().toISOString().split('T')[0]

    const { data: claim, error } = await supabase
      .from('daily_claims')
      .insert({
        user_id: userId,
        claim_date: today,
        day_number: status.nextDay,
        amount
      })
      .select()
      .single()

    if (error) throw error

    // Update user balance
    await supabase.rpc('update_user_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'daily_claim',
      p_description: `Daily reward day ${status.nextDay}`,
      p_reference_id: claim.id
    })

    return { amount, day: status.nextDay }
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('created_at')

    if (error) throw error
    return data
  },

  async getUserTaskCompletions(userId) {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('task_id, completed_at')
      .eq('user_id', userId)

    if (error) throw error
    return data
  },

  async completeTask(userId, taskId, sessionData = null) {
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError

    // Check if user already completed this task (for one-time tasks)
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
    const { data: completion, error } = await supabase
      .from('user_tasks')
      .insert({
        user_id: userId,
        task_id: taskId,
        reward_amount: task.reward,
        session_data: sessionData
      })
      .select()
      .single()

    if (error) throw error

    // Update user balance
    await supabase.rpc('update_user_balance', {
      p_user_id: userId,
      p_amount: task.reward,
      p_type: 'task_reward',
      p_description: `Task: ${task.title}`,
      p_reference_id: completion.id
    })

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
  },

  // Withdrawals
  async createWithdrawal(userId, amount, address, memo, network) {
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
    const { data: withdrawal, error } = await supabase
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

    if (error) throw error

    // Deduct from user balance
    await supabase.rpc('update_user_balance', {
      p_user_id: userId,
      p_amount: -amount,
      p_type: 'withdrawal',
      p_description: `Withdrawal to ${network}`,
      p_reference_id: withdrawal.id
    })

    return withdrawal
  },

  // Referrals
  async processReferral(referredUserId, referralCode) {
    if (!referralCode) return

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
  },

  async getUserStats(userId) {
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
      ...user,
      referralCount: referrals?.length || 0
    }
  }
}
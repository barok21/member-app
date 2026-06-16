import { supabase } from './supabase';
import { calculateMemberBalances } from './balance-calculator';
import { getNowEthiopian } from './ethiopian-date';

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  type: 'info' | 'warning' | 'success';
  likes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}


const normalizePhone = (p: string) => {
  let np = p.replace(/\D/g, '');
  if (np.startsWith('251')) np = '0' + np.slice(3);
  else if (!np.startsWith('0') && np.length === 9) np = '0' + np;
  return np;
};

const normalizeMemberId = (id: string) => {
  let nid = id.trim().toUpperCase();
  if (nid.startsWith('MEM') && !nid.startsWith('MEM-')) {
    nid = 'MEM-' + nid.slice(3);
  } else if (/^\d+$/.test(nid)) {
    nid = `MEM-${nid.padStart(5, '0')}`;
  }
  return nid;
};

export const memberApi = {
  async getMemberData(memberId: string, phone: string) {
    const nid = normalizeMemberId(memberId);
    const nph = normalizePhone(phone);

    // 1. Fetch Member
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select(`
        *,
        enrollments:member_enrollments(*)
      `)
      .eq('member_id', nid)
      .eq('phone', nph)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!members) return null;

    // 2. Fetch Payments
    const { data: payments, error: paymentsError } = await supabase
      .from('member_payments')
      .select('*')
      .eq('member_id', members.id);

    if (paymentsError) throw paymentsError;

    // 3. Fetch Categories
    const { data: categories, error: categoriesError } = await supabase
      .from('member_categories')
      .select('*');

    if (categoriesError) throw categoriesError;

    // 4. Fetch Declarations
    const { data: declarations, error: decError } = await supabase
      .from('payment_declarations')
      .select('*')
      .eq('member_id', members.id)
      .order('created_at', { ascending: false });

    // Calculate balances
    const currentEth = getNowEthiopian();
    const flattenedEnrollments = calculateMemberBalances(members, payments, categories || [], currentEth);

    // 5. Fetch Payment Methods
    const { data: paymentMethods } = await supabase
      .from('member_payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    return {
      member: members,
      enrollments: flattenedEnrollments,
      declarations: declarations || [],
      paymentMethods: paymentMethods || []
    };
  },

  async getPaymentMethods() {
    const { data, error } = await supabase
      .from('member_payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  },

  async submitDeclaration(data: {
    member_id: string;
    enrollment_id?: string;
    amount: number;
    payment_method: string;
    payment_for_month?: number;
    payment_for_year?: number;
    reference_number: string;
    type?: string;
    charity_note?: string;
  }) {
    const { error } = await supabase
      .from('payment_declarations')
      .insert({
        ...data,
        status: 'pending'
      });
    if (error) throw error;
    return { success: true };
  },

  async submitCharity(data: {
    member_id: string;
    amount: number;
    payment_method: string;
    reference_number: string;
    charity_note?: string;
  }) {
    return this.submitDeclaration({
      ...data,
      payment_for_month: 1,
      payment_for_year: 2016,
      type: 'charity',
      charity_note: data.charity_note
    });
  },

  async submitVerifiedPayment(data: {
    member_id: string;
    enrollment_id: string;
    amount: number;
    payment_for_month: number;
    payment_for_year: number;
    reference_number: string;
    receipt_data: any;
    receipt_url: string;
  }) {
    const { error: declError } = await supabase
      .from('payment_declarations')
      .insert({
        member_id: data.member_id,
        enrollment_id: data.enrollment_id,
        amount: data.amount,
        payment_method: 'receipt-verified',
        payment_for_month: data.payment_for_month,
        payment_for_year: data.payment_for_year,
        reference_number: data.reference_number,
        type: 'membership',
        status: 'approved',
        receipt_verified: true,
        receipt_data: data.receipt_data,
        receipt_url: data.receipt_url,
      });
    if (declError) throw declError;

    const { error: payError } = await supabase
      .from('member_payments')
      .insert({
        member_id: data.member_id,
        enrollment_id: data.enrollment_id,
        amount: data.amount,
        payment_for_month: data.payment_for_month,
        payment_for_year: data.payment_for_year,
        reference_number: data.reference_number,
        type: 'membership',
        payment_date: new Date().toISOString(),
      });
    if (payError) throw payError;

    return { success: true };
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('member_categories')
      .select('name')
      .order('name');
    if (error) throw error;
    return data;
  },

  async registerMember(formData: {
    fullName: string;
    gender: 'Male' | 'Female';
    phone: string;
    categoryName: string;
  }) {
    // 1. Generate ID (simplification: let server handle it or do it here)
    const { data: maxMember } = await supabase
      .from('members')
      .select('member_id')
      .ilike('member_id', 'MEM-%')
      .order('member_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let seq = 0;
    if (maxMember?.member_id) {
        const parts = maxMember.member_id.split('-');
        if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
            seq = parseInt(parts[1]);
        }
    }
    seq++;
    const newMemberId = `MEM-${String(seq).padStart(5, '0')}`;

    const nph = normalizePhone(formData.phone);

    // 2. Insert Member
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        member_id: newMemberId,
        full_name: formData.fullName.trim(),
        gender: formData.gender,
        phone: nph,
        category: formData.categoryName,
        status: 'pending',
        enrollment_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Create Enrollment
    await supabase.from('member_enrollments').insert({
        member_id: newMember.id,
        category_name: formData.categoryName,
        status: 'pending',
        enrollment_date: new Date().toISOString().split('T')[0]
    });

    return { success: true, memberId: newMemberId };
  },

  async getLeaderboard(category?: string, currentMemberId?: string) {
    // 1. Fetch members and their enrollments
    let query = supabase
      .from('members')
      .select(`
        *,
        enrollments:member_enrollments(*)
      `)
      .eq('status', 'active');
    
    if (category) {
      query = query.eq('category', category);
    }

    const { data: members, error: memberError } = await query;
    
    if (memberError) throw memberError;

    // 2. Fetch recent payments (up to 5000 rows to ensure we cover all active members' recent history)
    const { data: payments, error: paymentsError } = await supabase
      .from('member_payments')
      .select('*')
      .order('payment_for_year', { ascending: false })
      .order('payment_for_month', { ascending: false })
      .limit(5000);

    if (paymentsError) throw paymentsError;

    // 3. Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('member_categories')
      .select('*');

    if (categoriesError) throw categoriesError;

    // Group payments by member_id
    const memberPayments: Record<string, any[]> = {};
    payments.forEach(p => {
      if (!memberPayments[p.member_id]) memberPayments[p.member_id] = [];
      memberPayments[p.member_id].push(p);
    });

    const currentEth = getNowEthiopian();

    // 4. Calculate everything
    const allRankings = members.map(m => {
      const pData = memberPayments[m.id] || [];
      const envs = calculateMemberBalances(m, pData, categories || [], currentEth);
      const maxStreak = (envs || []).reduce((max, env) => Math.max(max, env.current_streak || 0), 0);
      
      const parts = m.full_name?.split(' ') || [];
      const firstName = parts[0] || 'Unknown';
      const fatherName = parts[1] || '';
      
      return {
        id: m.id,
        name: `${firstName} ${fatherName}`.trim(),
        streak: maxStreak
      };
    })
    .sort((a, b) => b.streak - a.streak);

    // 5. Determine current user's rank
    let myRank = -1;
    let myStreak = 0;
    if (currentMemberId) {
      myRank = allRankings.findIndex(m => m.id === currentMemberId) + 1;
      const myData = allRankings.find(m => m.id === currentMemberId);
      myStreak = myData ? myData.streak : 0;
    }

    return {
      top10: allRankings.slice(0, 10),
      myRank,
      myStreak
    };
  },

  async updatePushToken(memberId: string, token: string) {
    const { error } = await supabase
      .from('members')
      .update({ push_token: token })
      .eq('id', memberId);
    if (error) throw error;
    return { success: true };
  },

  async getActiveAnnouncement() {
    const { data, error } = await supabase
      .from('system_announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async incrementAnnouncementMetric(announcementId: string, metricType: 'like' | 'view') {
    const { error } = await supabase.rpc('increment_announcement_metric', {
      p_announcement_id: announcementId,
      p_metric_type: metricType
    });
    
    if (error) {
      console.error("Failed to increment metric:", error);
      return false;
    }
    return true;
  }
};

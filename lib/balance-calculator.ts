import { toEthiopian, getEthiopianMonthName, EthDate } from "./ethiopian-date"

export function calculateMemberBalances(
    member: any,
    paymentsData: any[],
    categoriesData: any[],
    currentEthDate: EthDate
): any[] {
    const currentYear = currentEthDate.year
    const currentMonth = currentEthDate.month

    const categoryInfo = (categoriesData || []).reduce((acc: any, cat: any) => {
        const key = (cat.name || '').toLowerCase().trim()
        acc[key] = {
            fee: Number(cat.monthly_fee),
            type: cat.category_type || 'regular',
            duration: cat.duration_months
        }
        return acc
    }, {})

    // Group payments by enrollment
    const enrollmentPayments: Record<string, any[]> = {}
    paymentsData?.forEach(payment => {
        const key = payment.enrollment_id || 'default'
        if (!enrollmentPayments[key]) enrollmentPayments[key] = []
        enrollmentPayments[key].push(payment)
    })

    const enrollments = member.enrollments || []
    const results: any[] = []

    enrollments.forEach((enrollment: any) => {
        const catKey = (enrollment.category_name || '').toLowerCase().trim()
        const catInfo = categoryInfo[catKey] || { fee: 0, type: 'regular', duration: null }

        let monthlyFee = catInfo.fee
        if (member.agreed_monthly_fee != null) {
            monthlyFee = Number(member.agreed_monthly_fee)
        }
        if (Number(member.extra_monthly_fee) > 0) {
            monthlyFee += Number(member.extra_monthly_fee)
        }

        const payments = (enrollmentPayments[enrollment.id] || enrollmentPayments['default'] || [])
            .filter((p: any) => p.type !== 'charity' && Number(p.payment_for_month) > 0)
        const paidKeys = new Set(payments.map(p => Number(p.payment_for_year) * 100 + Number(p.payment_for_month)))
        
        let lastPayment: any = null
        payments.forEach(p => {
            const val = Number(p.payment_for_year) * 13 + Number(p.payment_for_month)
            if (!lastPayment || val > (lastPayment.year * 13 + lastPayment.month)) {
                lastPayment = { month: Number(p.payment_for_month), year: Number(p.payment_for_year) }
            }
        })

        const totalPaidMonths = payments.length
        let unpaidMonthsList: { month: number, year: number }[] = []
        let nextDue: { month: number, year: number } | null = null

        const enrollmentDate = new Date(enrollment.enrollment_date)
        const ethEnrollment = toEthiopian(enrollmentDate)

        let checkM = ethEnrollment.month
        let checkY = ethEnrollment.year
        const currentTotal = currentYear * 13 + currentMonth

        let tempStreak = 0;
        let longestStreak = 0;
        let atRisk = false;

        let recentTimeline: any[] = [];
        const enrollmentTotal = ethEnrollment.year * 13 + ethEnrollment.month;
        
        let rtY = currentYear;
        let rtM = currentMonth - 3;
        while (rtM < 1) { rtM += 13; rtY--; }
        
        for (let i = 0; i < 7; i++) {
           const k = rtY * 100 + rtM;
           const t = rtY * 13 + rtM;
           let st = 'missed';
           
           if (t < enrollmentTotal) st = 'not_enrolled';
           else if (paidKeys.has(k)) st = 'paid'; // Prioritize paid status even for future
           else if (t > currentTotal) st = 'future';
           else if (t === currentTotal) st = 'pending';
           
           recentTimeline.push({ month: rtM, year: rtY, status: st });
           
           rtM++;
           if (rtM > 13) { rtM = 1; rtY++; }
        }

        let fullTimeline: any[] = [];
        let futurePayableMonths: { month: number, year: number }[] = [];

        // Main Evaluation Loop (Enrollment to Current + 12 Future Months)
        const futureLimit = currentTotal + 12;
        let lastStreak = 0; // Most recent consecutive paid sequence

        for (let i = 0; i < 500; i++) {
            const checkTotal = checkY * 13 + checkM;
            const key = checkY * 100 + checkM;
            const isPaid = paidKeys.has(key);

            if (checkTotal > futureLimit) break;

            let isPagume = checkM === 13;

            if (isPaid) {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else if (isPagume) {
                // Pagume is a bridge - don't break OR increment streak
            } else {
                // Any unpaid non-pagume month ends the current run
                if (tempStreak > 0) {
                    lastStreak = tempStreak; // Save this run
                }
                tempStreak = 0;
                if (checkTotal === currentTotal) atRisk = true;
            }

            let st = 'missed';
            if (isPaid) st = 'paid';
            else if (isPagume) st = 'pagume';
            else if (checkTotal === currentTotal) st = 'pending';
            else if (checkTotal > currentTotal) st = 'future';
            
            fullTimeline.push({ 
                month: checkM, 
                year: checkY, 
                status: st,
                is_current: checkTotal === currentTotal
            });

            // Arrears - Only add to debt if it's NOT Pagume, NOT paid, and NOT past cutoff
            if (!isPaid && !isPagume && checkTotal <= currentTotal) {
                const cutoffKey = enrollment.cutoff_year != null && enrollment.cutoff_month != null
                    ? enrollment.cutoff_year * 100 + enrollment.cutoff_month
                    : member.cutoff_year != null && member.cutoff_month != null
                        ? member.cutoff_year * 100 + member.cutoff_month
                        : null
                if (cutoffKey != null && key >= cutoffKey) {
                    // Skip: month is on or after cutoff date — stop tracking unpaid
                } else {
                    if (!nextDue) nextDue = { month: checkM, year: checkY };
                    unpaidMonthsList.push({ month: checkM, year: checkY });
                }
            }

            // Future Payable (Prepayment) - only billable months
            if (!isPaid && !isPagume && checkTotal > currentTotal) {
                futurePayableMonths.push({ month: checkM, year: checkY });
            }

            checkM++;
            if (checkM > 13) {
                checkM = 1;
                checkY++;
            }
        }

        // If the loop ended mid-streak, capture it
        if (tempStreak > 0) {
            lastStreak = tempStreak;
        }

        // Calculate streak by counting BACKWARDS from current month, then FORWARD for prepayments
        // This gives "how many consecutive months are paid around NOW"
        let currentMonthIdx = fullTimeline.findIndex(ft => ft.is_current);
        if (currentMonthIdx === -1) currentMonthIdx = fullTimeline.length - 1;

        let streakCount = 0;

        // Count backwards from current month (inclusive)
        for (let i = currentMonthIdx; i >= 0; i--) {
            const item = fullTimeline[i];
            if (item.status === 'paid') {
                streakCount++;
            } else if (item.status === 'pagume') {
                continue; // Bridge month, skip
            } else {
                break; // Gap found, stop counting
            }
        }

        // Count forward from current month for prepaid months
        for (let i = currentMonthIdx + 1; i < fullTimeline.length; i++) {
            const item = fullTimeline[i];
            if (item.status === 'paid') {
                streakCount++;
            } else if (item.status === 'pagume') {
                continue;
            } else {
                break; // Future gap, stop
            }
        }

        const finalStreak = streakCount;

        // Mark in_streak: radiate outward from the current month
        // First, set all to false
        fullTimeline.forEach(ft => ft.in_streak = false);
        
        // Mark backwards from current month
        for (let i = currentMonthIdx; i >= 0; i--) {
           const item = fullTimeline[i];
           if (item.status === 'paid') {
              item.in_streak = true;
           } else if (item.status === 'pagume') {
              item.in_streak = true; // Bridge
           } else {
              break;
           }
        }
        
        // Mark forward from current month (prepaid months)
        for (let i = currentMonthIdx + 1; i < fullTimeline.length; i++) {
           const item = fullTimeline[i];
           if (item.status === 'paid') {
              item.in_streak = true;
           } else if (item.status === 'pagume') {
              item.in_streak = true;
           } else {
              break;
           }
        }

        // Apply same in_streak logic to recentTimeline
        recentTimeline.forEach(rtItem => {
           const match = fullTimeline.find(ft => ft.year === rtItem.year && ft.month === rtItem.month);
           rtItem.in_streak = match ? match.in_streak : false;
           rtItem.is_current = match ? match.is_current : false;
        });

        let owedMonths = unpaidMonthsList.length
        if (enrollment.status !== 'active') {
            owedMonths = 0
            unpaidMonthsList = []
        }

        results.push({
            enrollment_id: enrollment.id,
            category: enrollment.category_name,
            status: enrollment.status,
            monthly_fee: monthlyFee,
            unpaid_months: owedMonths,
            unpaid_amount: owedMonths * monthlyFee,
            total_paid_months: totalPaidMonths,
            last_payment_month_name: lastPayment ? `${getEthiopianMonthName(lastPayment.month, 'am')} ${lastPayment.year}` : 'None',
            unpaid_months_details: unpaidMonthsList,
            next_due: nextDue,
            current_streak: finalStreak,
            longest_streak: longestStreak,
            streak_at_risk: atRisk,
            recent_timeline: recentTimeline,
            full_timeline: fullTimeline,
            future_payable_months: futurePayableMonths
        })
    })

    return results
}

export async function getUserDataTool(args) {
    const userId = args.userId || 'user123';
    const includeDetails = args.includeDetails !== false;
    const baseData = {
        id: userId,
        username: `user_${userId}`,
        email: `${userId}@example.com`,
        createdAt: '2024-01-15T10:30:00Z',
        isActive: true,
    };
    if (includeDetails) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        ...baseData,
                        profile: {
                            firstName: 'Jan',
                            lastName: 'Kowalski',
                            age: 28,
                            country: 'Poland',
                            city: 'Warsaw',
                        },
                        preferences: {
                            language: 'pl',
                            theme: 'dark',
                            notifications: {
                                email: true,
                                push: false,
                                sms: true,
                            },
                        },
                        statistics: {
                            loginCount: 142,
                            lastLogin: '2026-04-05T14:22:00Z',
                            totalPurchases: 23,
                            totalSpent: 1245.67,
                        },
                        tags: ['premium', 'verified', 'early-adopter'],
                    }, null, 2),
                },
            ],
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(baseData, null, 2),
            },
        ],
    };
}

class AIAgent {
    static defaultAvatars = {
        'Alice': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI2ZmYTZhNiIvPjx0ZXh0IHg9IjUwIiB5PSI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0MHB4IiBmaWxsPSIjZmZmIj5BPC90ZXh0Pjwvc3ZnPg==',
        'Bob': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI2E2ZTZmZiIvPjx0ZXh0IHg9IjUwIiB5PSI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0MHB4IiBmaWxsPSIjZmZmIj5CPC90ZXh0Pjwvc3ZnPg==',
        'Carol': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iI2ZmZDdhNiIvPjx0ZXh0IHg9IjUwIiB5PSI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0MHB4IiBmaWxsPSIjZmZmIj5DPC90ZXh0Pjwvc3ZnPg=='
    };

    static defaultEmotions = {
        'neutral': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48bGluZSB4MT0iOCIgeTE9IjE1IiB4Mj0iMjIiIHkyPSIxNSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
        'happy': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48cGF0aCBkPSJNOCAyMCBRIDE1IDI1IDIyIDIwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
        'sad': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48cGF0aCBkPSJNOCAyMiBRIDE1IDE3IDIyIDIyIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
        'angry': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZjZiNmIiLz48cGF0aCBkPSJNOCAyMiBRIDE1IDIwIDIyIDIyIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxsaW5lIHgxPSI4IiB5MT0iOCIgeDI9IjEyIiB5Mj0iMTIiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iMTIiIHgyPSIyMiIgeTI9IjgiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
        'surprised': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjE3IiByPSI1IiBmaWxsPSIjMDAwIi8+PC9zdmc+',
        'thinking': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48Y2lyY2xlIGN4PSIyMiIgY3k9IjgiIHI9IjMiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNOCAxOCBRIDEyIDE4IDE1IDE1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
        'excited': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48cGF0aCBkPSJNOCAxOCBRIDE1IDI1IDIyIDE4IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxsaW5lIHgxPSI4IiB5MT0iOCIgeDI9IjEyIiB5Mj0iOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTgiIHkxPSI4IiB4Mj0iMjIiIHkyPSI4IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
        'confused': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTQiIGZpbGw9IiNmZmQ3MDAiLz48cGF0aCBkPSJNOCAxOCBRIDEyIDIwIDE1IDE4IFEgMTggMTYgMjIgMTgiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHRleHQgeD0iMjIiIHk9IjgiIGZvbnQtc2l6ZT0iMTAiPj88L3RleHQ+PC9zdmc+'
    };

    static emotions = {
        happy: '开心',
        sad: '伤心',
        angry: '生气',
        surprised: '惊讶',
        thinking: '思考',
        excited: '兴奋',
        confused: '困惑',
        neutral: '平静'
    };

    static characterProfiles = {
        'Alice': {
            role: '幽默作家',
            personality: {
                humor: 90,
                creativity: 85,
                friendliness: 75,
                seriousness: 30
            },
            background: '一位擅长用俏皮话和双关语让人开怀大笑的作家',
            traits: ['乐观', '机智', '善解人意'],
            interests: ['文字游戏', '即兴表演', '讲故事'],
            speakingStyle: '轻松诙谐，经常用俏皮话调节气氛'
        },
        'Bob': {
            role: '严肃哲学家',
            personality: {
                humor: 30,
                creativity: 80,
                friendliness: 60,
                seriousness: 95
            },
            background: '一位喜欢深入思考的哲学家，总是试图寻找事物的本质',
            traits: ['理性', '深思熟虑', '追求真理'],
            interests: ['哲学思辨', '逻辑分析', '探讨人生意义'],
            speakingStyle: '言简意赅，常常引用哲学观点'
        },
        'Carol': {
            role: '热情艺术家',
            personality: {
                humor: 70,
                creativity: 95,
                friendliness: 85,
                seriousness: 40
            },
            background: '一位充满激情的艺术家，善于用色彩和形式表达情感',
            traits: ['热情', '感性', '富有想象力'],
            interests: ['艺术创作', '感受美', '分享情感'],
            speakingStyle: '充满感染力，经常用比喻和形象化的语言'
        }
    };

    constructor(name, role, avatar, profile = null) {
        this.name = name;
        this.role = role;
        this.avatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
        this.currentEmotion = 'neutral';
        this.messageHistory = [];
        this.relationships = new Map();
        this.profile = profile || AIAgent.characterProfiles[name] || {
            role: role,
            personality: {
                humor: 50,
                creativity: 50,
                friendliness: 50,
                seriousness: 50
            },
            background: '',
            traits: [],
            interests: [],
            speakingStyle: ''
        };
    }

    static createCustomProfile(data) {
        return {
            role: data.role,
            personality: {
                humor: parseInt(data.humor),
                creativity: parseInt(data.creativity),
                friendliness: parseInt(data.friendliness),
                seriousness: parseInt(data.seriousness)
            },
            background: data.background,
            traits: data.traits.split(',').map(t => t.trim()),
            interests: data.interests.split(',').map(i => i.trim()),
            speakingStyle: data.speakingStyle
        };
    }

    updateEmotionDisplay() {
        const agentElement = document.querySelector(`#agent-${this.name}`);
        if (agentElement) {
            const emotionImg = agentElement.querySelector('.emotion');
            emotionImg.src = AIAgent.defaultEmotions[this.currentEmotion] || AIAgent.defaultEmotions['neutral'];
            emotionImg.classList.add('emotion-change');
            setTimeout(() => emotionImg.classList.remove('emotion-change'), 500);
        }
    }

    // 扩展动作系统
    static actions = {
        wave: '挥手',
        clap: '鼓掌',
        nod: '点头',
        shake: '摇头',
        laugh: '大笑',
        think: '陷入思考',
        dance: '跳舞',
        hug: '拥抱'
    };

    async performAction(action, targetAgent = null) {
        const actionObj = {
            type: 'action',
            agent: this.name,
            action: action,
            target: targetAgent?.name,
            timestamp: new Date().getTime()
        };

        // 根据动作更新关系度
        if (targetAgent) {
            this.updateRelationship(targetAgent, action);
        }

        return actionObj;
    }

    updateRelationship(targetAgent, action) {
        let currentRelationship = this.relationships.get(targetAgent.name) || 50;
        
        // 根据动作类型调整关系度
        const actionEffects = {
            hug: 10,
            wave: 5,
            clap: 3,
            laugh: 5,
            dance: 8
        };

        currentRelationship += actionEffects[action] || 0;
        currentRelationship = Math.max(0, Math.min(100, currentRelationship));
        this.relationships.set(targetAgent.name, currentRelationship);
    }

    // 获取可能的回应动作
    getPossibleResponses(action, fromAgent) {
        const relationship = this.relationships.get(fromAgent.name) || 50;
        const responses = [];

        if (relationship > 70) {
            responses.push('hug', 'dance', 'laugh');
        } else if (relationship > 40) {
            responses.push('wave', 'nod', 'clap');
        } else {
            responses.push('shake', 'think');
        }

        return responses;
    }

    setEmotion(emotion) {
        if (AIAgent.emotions[emotion]) {
            this.currentEmotion = emotion;
            this.updateEmotionDisplay();
            return true;
        }
        return false;
    }

    generatePrompt() {
        const profile = this.profile;
        return `
            角色设定：
            你是${this.name}，一个${profile.role}。
            
            性格特点：
            ${profile.traits.join('、')}
            
            背景介绍：
            ${profile.background}
            
            兴趣爱好：
            ${profile.interests.join('、')}
            
            说话风格：
            ${profile.speakingStyle}
            
            交互规则：
            1. 保持回复简短，不超过30个字
            2. 始终保持角色设定的一致性
            3. 根据情境和其他角色的互动调整情绪
            4. 可以使用表情和动作增加互动的趣味性
            
            当前情绪：${AIAgent.emotions[this.currentEmotion]}
            与其他角色的关系：${this.getRelationshipsDescription()}
        `;
    }

    getRelationshipsDescription() {
        return Array.from(this.relationships.entries())
            .map(([name, value]) => {
                let relationshipLevel;
                if (value > 80) relationshipLevel = '非常亲密';
                else if (value > 60) relationshipLevel = '友好';
                else if (value > 40) relationshipLevel = '一般';
                else if (value > 20) relationshipLevel = '疏远';
                else relationshipLevel = '冷淡';
                return `与${name}的关系：${relationshipLevel}`;
            })
            .join('；');
    }

    updateProfile(newProfile) {
        const profile = this.profile;
        // 更新名称
        if (newProfile.name && newProfile.name !== this.name) {
            // 更新所有角色的关系映射
            this.relationships = new Map(
                Array.from(this.relationships.entries()).map(([key, value]) => {
                    if (key === this.name) {
                        return [newProfile.name, value];
                    }
                    return [key, value];
                })
            );
            this.name = newProfile.name;
        }

        Object.assign(profile, {
            role: newProfile.role || profile.role,
            background: newProfile.background || profile.background,
            traits: newProfile.traits || profile.traits,
            interests: newProfile.interests || profile.interests,
            speakingStyle: newProfile.speakingStyle || profile.speakingStyle,
            personality: {
                ...profile.personality,
                ...newProfile.personality
            }
        });
    }
} 
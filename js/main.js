// 预设头像列表
const defaultAvatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucy',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Oscar',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Coco',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby'
];

class AIChat {
    constructor() {
        this.agents = [];
        this.storyBackground = '';
        this.currentEvent = '';
        this.autoScroll = true;
        this.conversationSpeed = 3;
        this.isConversationActive = false;
        this.isPaused = false;
        this.messageHistory = [];
        this.conversationHistory = [];
        this.userParticipation = true;
        this.typingTimeout = null;
        this.isProcessing = false;
        this.initialized = false;

        // 加载保存的背景和事件
        this.loadStoredSettings();

        // 绑定方法到实例
        this.sendUserMessage = this.sendUserMessage.bind(this);
        this.initializeEventListeners();
    }

    loadStoredSettings() {
        const storedBackground = localStorage.getItem('storyBackground');
        const storedEvent = localStorage.getItem('currentEvent');
        
        if (storedBackground) {
            this.setStoryBackground(storedBackground);
        }
        
        if (storedEvent) {
            this.setCurrentEvent(storedEvent);
        }

        // 确保DOM元素存在后再设置值
        setTimeout(() => {
            const backgroundInput = document.getElementById('storyBackground');
            const eventInput = document.getElementById('currentEvent');
            
            if (backgroundInput && storedBackground) {
                backgroundInput.value = storedBackground;
            }
            
            if (eventInput && storedEvent) {
                eventInput.value = storedEvent;
            }
        }, 0);
    }

    initializeEventListeners() {
        // API密钥相关
        document.getElementById('submitApiKey')?.addEventListener('click', () => this.submitApiKey());
        
        // 对话控制相关
        document.getElementById('startConversation')?.addEventListener('click', () => this.startConversation());
        document.getElementById('pauseConversation')?.addEventListener('click', () => this.pauseConversation());
        document.getElementById('resetConversation')?.addEventListener('click', () => this.resetConversation());
        document.getElementById('toggleAutoScroll')?.addEventListener('click', () => this.toggleAutoScroll());
        
        // 消息发送相关
        document.getElementById('sendMessage')?.addEventListener('click', () => this.sendUserMessage());
        document.getElementById('userInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendUserMessage();
            }
        });

        // 故事设置相关
        document.getElementById('updateBackground')?.addEventListener('click', () => {
            const backgroundInput = document.getElementById('storyBackground');
            const background = backgroundInput?.value.trim();
            
            if (!background) {
                this.showToast('请输入故事背景', 'warning');
                return;
            }
            
            this.setStoryBackground(background);
            localStorage.setItem('storyBackground', background);
            backgroundInput.value = '';
            this.showToast('背景已更新');
        });

        document.getElementById('updateEvent')?.addEventListener('click', () => {
            const eventInput = document.getElementById('currentEvent');
            const event = eventInput?.value.trim();
            
            if (!event) {
                this.showToast('请输入当前事件', 'warning');
                return;
            }
            
            this.setCurrentEvent(event);
            localStorage.setItem('currentEvent', event);
            eventInput.value = '';
            this.showToast('事件已更新');
            this.notifyAgentsOfEvent();
        });

        // 创建角色相关的事件监听器
        document.getElementById('submitAgent')?.addEventListener('click', () => {
            this.submitAgentForm();
        });

        // 速度控制
        document.getElementById('conversationSpeed')?.addEventListener('change', (e) => {
            this.setConversationSpeed(parseInt(e.target.value));
        });
    }

    async initializeAPI(apiKey) {
        try {
            this.api = new DeepseekAPI(apiKey);
            
            // 隐藏API密钥模态框
            const apiKeyModal = document.getElementById('apiKeyModal');
            if (apiKeyModal) {
                apiKeyModal.style.display = 'none';
            }

            // 显示主界面
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }

            // 只在第一次初始化时创建默认角色
            if (!this.initialized) {
                await this.initializeAgents();
                this.initialized = true;
            }

            console.log('API初始化成功');
            return true;
        } catch (error) {
            console.error('API初始化失败:', error);
            throw error;
        }
    }

    async submitApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (!apiKey) {
            const errorDiv = document.getElementById('apiKeyError');
            if (errorDiv) {
                errorDiv.textContent = '请输入API密钥';
                errorDiv.style.display = 'block';
            }
            return;
        }

        const success = await this.initializeAPI(apiKey);
        if (success) {
            console.log('API初始化成功');
        }
    }

    async sendUserMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        
        if (!message || this.isProcessing) return;
        
        // 设置处理状态
        this.isProcessing = true;
        const sendButton = document.getElementById('sendMessage');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        try {
            // 清空输入框
            userInput.value = '';
            
            // 分析用户消息
            const messageAnalysis = this.analyzeUserMessage(message);
            
            // 添加用户消息到对话历史
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().getTime(),
                analysis: messageAnalysis
            });
            
            // 添加用户消息到对话区域
            this.addMessageToChat('用户', message);
            
            // 确定应该响应的角色
            const respondingAgents = this.determineRespondingAgents(messageAnalysis);
            
            // 让选定的角色响应用户消息
            for (const agent of respondingAgents) {
                if (!this.isPaused) {
                    try {
                        const response = await this.generateUserResponseForAgent(agent, message, messageAnalysis);
                        
                        // 添加角色回复到对话历史
                        this.conversationHistory.push({
                            role: 'assistant',
                            name: agent.name,
                            content: response,
                            timestamp: new Date().getTime()
                        });
                        
                        this.addMessageToChat(agent.name, response, agent.avatar);
                        
                        // 更新角色关系
                        this.updateAgentRelationshipsAfterUserInteraction(agent, messageAnalysis);
                    } catch (error) {
                        console.error(`${agent.name} 响应失败:`, error);
                        this.addMessageToChat(agent.name, '抱歉，我现在无法回应...', agent.avatar, true);
                    }
                }
            }
        } finally {
            // 重置处理状态
            this.isProcessing = false;
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }
        }
    }

    analyzeUserMessage(message) {
        // 分析消息的情感倾向
        const sentimentKeywords = {
            positive: ['喜欢', '好', '棒', '感谢', '开心', '快乐', '期待'],
            negative: ['不喜欢', '讨厌', '差', '烦', '生气', '难过', '失望'],
            neutral: ['觉得', '认为', '想', '也许', '可能']
        };
        
        // 分析消息的目标对象
        const targetedAgents = this.agents.filter(agent => 
            message.includes(agent.name) || 
            message.toLowerCase().includes(agent.name.toLowerCase())
        );
        
        // 分析消息类型
        const messageType = this.determineMessageType(message);
        
        // 分析消息的紧急程度
        const urgencyLevel = this.determineUrgencyLevel(message);
        
        return {
            sentiment: this.analyzeSentiment(message, sentimentKeywords),
            targetedAgents: targetedAgents,
            messageType: messageType,
            urgencyLevel: urgencyLevel,
            timestamp: new Date().getTime()
        };
    }

    determineMessageType(message) {
        const types = {
            question: ['吗', '?', '？', '什么', '为什么', '怎么'],
            command: ['请', '帮我', '能否', '可以'],
            statement: ['我觉得', '我认为', '我想'],
            greeting: ['你好', '早上好', '晚上好', '嗨'],
            farewell: ['再见', '拜拜', '晚安']
        };
        
        for (const [type, keywords] of Object.entries(types)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return type;
            }
        }
        return 'general';
    }

    determineUrgencyLevel(message) {
        const urgentKeywords = ['立即', '马上', '快', '紧急', '现在'];
        const normalKeywords = ['稍后', '有空', '等一下'];
        
        if (urgentKeywords.some(keyword => message.includes(keyword))) {
            return 'high';
        } else if (normalKeywords.some(keyword => message.includes(keyword))) {
            return 'low';
        }
        return 'normal';
    }

    analyzeSentiment(message, keywords) {
        let score = 0;
        
        for (const word of keywords.positive) {
            if (message.includes(word)) score += 1;
        }
        
        for (const word of keywords.negative) {
            if (message.includes(word)) score -= 1;
        }
        
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    determineRespondingAgents(messageAnalysis) {
        const { targetedAgents, messageType, urgencyLevel, sentiment } = messageAnalysis;
        let respondingAgents = [];
        
        // 如果消息明确指向某些角色
        if (targetedAgents.length > 0) {
            respondingAgents = targetedAgents;
        } 
        // 如果是紧急消息，让关系最好的角色响应
        else if (urgencyLevel === 'high') {
            respondingAgents = [this.getMostFriendlyAgent()];
        }
        // 如果是问题，让最适合回答的角色响应
        else if (messageType === 'question') {
            respondingAgents = [this.getMostKnowledgeableAgent()];
        }
        // 如果是打招呼，让最活跃���角色响应
        else if (messageType === 'greeting' || messageType === 'farewell') {
            respondingAgents = [this.getMostActiveAgent()];
        }
        // 默认情况，随机选择1-2个角色响应
        else {
            respondingAgents = this.getRandomRespondingAgents(1 + Math.floor(Math.random() * 2));
        }
        
        return respondingAgents;
    }

    getMostFriendlyAgent() {
        return this.agents.reduce((friendliest, current) => {
            return (current.profile.personality.friendliness > (friendliest?.profile.personality.friendliness || 0))
                ? current
                : friendliest;
        }, null);
    }

    getMostKnowledgeableAgent() {
        // 可以根据角色的背景和特征来判断
        return this.agents.reduce((mostKnowledgeable, current) => {
            return (current.profile.personality.seriousness > (mostKnowledgeable?.profile.personality.seriousness || 0))
                ? current
                : mostKnowledgeable;
        }, null);
    }

    getMostActiveAgent() {
        // 可以根据角色的活跃度来判断
        return this.agents[Math.floor(Math.random() * this.agents.length)];
    }

    getRandomRespondingAgents(count) {
        const shuffled = [...this.agents].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, this.agents.length));
    }

    async generateUserResponseForAgent(agent, userMessage, messageAnalysis) {
        const prompt = `作为${agent.name}，你需要回应用户的消息：
"${userMessage}"

消息分析：
- 情感倾向：${messageAnalysis.sentiment}
- 消息类型：${messageAnalysis.messageType}
- 紧急程度：${messageAnalysis.urgencyLevel}

回应要求：
1. 要根据消息的类型和情感倾向做出适当回应
2. 保持你的角色特征和说话风格
3. 如果是问题要给出有帮助的回答
4. 如果是负面情绪要表示理解和安慰
5. 如果是紧急情况要表现出关心

请生成一个简短但恰当的回应。`;

        return await this.api.generateResponse(prompt, this.getConversationContext());
    }

    updateAgentRelationshipsAfterUserInteraction(agent, messageAnalysis) {
        const { sentiment } = messageAnalysis;
        const relationshipChange = sentiment === 'positive' ? 2 : 
                                 sentiment === 'negative' ? -2 : 0;
        
        if (relationshipChange !== 0) {
            this.agents.forEach(otherAgent => {
                if (otherAgent !== agent) {
                    const currentRelationship = agent.relationships.get(otherAgent.name) || 50;
                    const newRelationship = Math.max(0, Math.min(100, currentRelationship + relationshipChange));
                    agent.relationships.set(otherAgent.name, newRelationship);
                    otherAgent.relationships.set(agent.name, newRelationship);
                }
            });
        }
    }

    async generateResponse(agent, userMessage = '', context = []) {
        if (!window.api) {
            throw new Error('API未初始化');
        }

        try {
            const prompt = this.createPromptForAgent(agent);
            const messages = [
                { role: 'system', content: prompt },
                ...context
            ];

            if (userMessage) {
                messages.push({ 
                    role: 'user', 
                    content: `${userMessage}\n\n请记住：\n1. 保持回复简短，回复字数必须在10-20字之间\n2. 保持角色设定\n3. 语气要符合性格特征` 
                });
            }

            let response = await window.api.generateText(messages);
            
            // 处理回复长度
            response = this.truncateResponse(response, 20);
            
            return response;
        } catch (error) {
            console.error('生成回复失败:', error);
            throw error;
        }
    }

    truncateResponse(response, maxLength = 20) {
        // 移除多余的空格和换行
        response = response.trim().replace(/\s+/g, ' ');
        
        // 如果回复太长，截断到最后一个完整句子
        if (response.length > maxLength) {
            const sentences = response.match(/[^。！？.!?]+[。！？.!?]/g) || [response];
            response = sentences[0];
            
            // 如果第一句话仍然太长，直接截断
            if (response.length > maxLength) {
                response = response.substring(0, maxLength) + '。';
            }
        }
        
        // 如果回复太短，添加语气词
        if (response.length < 10) {
            const particles = ['呢', '啊', '呀', '哦', '哎'];
            response += particles[Math.floor(Math.random() * particles.length)];
        }
        
        return response;
    }

    addMessageToChat(sender, message, avatar = null, isSystem = false) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSystem ? 'system' : ''} ${sender === '用户' ? 'user' : ''}`;
        
        let avatarHtml = '';
        if (avatar && !isSystem) {
            avatarHtml = `<img src="${avatar}" class="message-avatar" alt="${sender}的头像">`;
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isSystem) {
            messageContent.textContent = message;
            messageDiv.appendChild(messageContent);
        } else {
            if (sender !== '用户') {
                messageDiv.innerHTML = avatarHtml;
                messageContent.innerHTML = `
                    <div class="sender-name">${sender}</div>
                    <div class="message-text"></div>
                `;
                messageDiv.appendChild(messageContent);
                this.typeMessage(messageContent.querySelector('.message-text'), message);
            } else {
                messageDiv.innerHTML = `
                    ${avatarHtml}
                    <div class="message-content">
                        <div class="message-text">${message}</div>
                    </div>
                `;
            }
        }

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (!this.autoScroll) return;
        
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            const scrollHeight = chatMessages.scrollHeight;
            const clientHeight = chatMessages.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            
            // 使用平滑滚动
            chatMessages.scrollTo({
                top: maxScroll,
                behavior: 'smooth'
            });
        }
    }

    async typeMessage(element, message, index = 0) {
        if (!element || index >= message.length) return;
        
        element.textContent = message.substring(0, index + 1);
        
        // 根据会话速度调整打字速度
        const typingSpeed = this.getTypingSpeed();
        
        // 如果遇到标点符号，稍微停顿一下
        const currentChar = message[index];
        const pauseChars = '，。！？,.!?';
        const extraDelay = pauseChars.includes(currentChar) ? 200 : 0;

        if (!this.isPaused) {
            await new Promise(resolve => {
                this.typingTimeout = setTimeout(resolve, typingSpeed + extraDelay);
            });
            await this.typeMessage(element, message, index + 1);
        }
        
        // 如果是最后一个字符，滚动到底部
        if (index === message.length - 1) {
            this.scrollToBottom();
        }
    }

    getTypingSpeed() {
        // 根据会话速度设置打字速度
        const speeds = {
            1: 100, // 很慢
            2: 70,  // 慢
            3: 40,  // 正常
            4: 20,  // 快
            5: 10   // 很快
        };
        return speeds[this.conversationSpeed] || speeds[3];
    }

    setConversationSpeed(speed) {
        this.conversationSpeed = Math.max(1, Math.min(5, speed));
        const speedValue = document.querySelector('.speed-value');
        if (speedValue) {
            const speedLabels = {
                1: '很慢',
                2: '慢',
                3: '正常',
                4: '快',
                5: '很快'
            };
            speedValue.textContent = speedLabels[this.conversationSpeed];
        }
    }

    createPromptForAgent(agent) {
        const profile = agent.profile;
        let prompt = `你是${agent.name}，一个${profile.role}。

角色设定：
- 性格特点：${profile.traits.join('、')}
- 背景介绍：${profile.background}
- 兴趣爱好：${profile.interests.join('、')}
- 说话风格：${profile.speakingStyle}

性格倾向：
- 幽默感：${profile.personality.humor}%
- 创造力：${profile.personality.creativity}%
- 友好度：${profile.personality.friendliness}%
- 严肃性：${profile.personality.seriousness}%

当前状态：
- 情绪：${AIAgent.emotions[agent.currentEmotion]}
- 所处环境：${this.storyBackground || '（无特定背景）'}
- 正在发生：${this.currentEvent || '（无特定事件）'}

对话要求：
1. 保持角色个性和说话风格的一致性
2. 对话要有连续性，要对之前的对话内容做出回应
3. 可以表达对其他角色言论的赞同或质疑
4. 可以主动询问或回应其他角色的情绪状态
5. 回复长度控制在10-20字之间
6. 说话要符合当前的情绪状态

注意事项：
1. 要记住你是谁，保持角色特征
2. 要关注其他角色的情绪变化
3. 要对之前的对话内容有记忆和延续
4. 可以表达对当前事件的看法
5. 可以对其他角色的态度做出回应\n`;

        return prompt;
    }

    generateActionButtons(agent) {
        return Object.entries(AIAgent.actions)
            .map(([action, label]) => `
                <button class="action-btn" 
                        onclick="window.aiChat.handleUserAction('${action}', '${agent.name}')">
                    ${label}
                </button>
            `).join('');
    }

    async handleUserAction(action, targetAgentName) {
        const targetAgent = this.agents.find(a => a.name === targetAgentName);
        if (!targetAgent) return;

        this.displayAction('用户', action, targetAgent.name);

        const possibleResponses = targetAgent.getPossibleResponses(action, {name: '用户'});
        const response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
        
        setTimeout(() => {
            targetAgent.performAction(response);
            this.displayAction(targetAgent.name, response, '用户');
        }, 1000);
    }

    displayAction(fromName, action, toName) {
        const chatContainer = document.querySelector('.chat-messages');
        const actionElement = document.createElement('div');
        actionElement.className = 'action-message';
        actionElement.innerHTML = `
            <span class="action-text">
                ${fromName} ${AIAgent.actions[action]} ${toName ? `向 ${toName}` : ''}
            </span>
        `;
        chatContainer.appendChild(actionElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async startConversation() {
        if (this.agents.length === 0) {
            this.showToast('请先创建至少一个角色', 'warning');
            return;
        }

        if (this.isConversationActive && this.isPaused) {
            this.resumeConversation();
            return;
        }

        if (this.isConversationActive) {
            this.showToast('对话已经在进行中', 'warning');
            return;
        }

        this.isConversationActive = true;
        this.isPaused = false;
        const startButton = document.getElementById('startConversation');
        const pauseButton = document.getElementById('pauseConversation');
        
        if (startButton && pauseButton) {
            startButton.style.display = 'none';
            pauseButton.style.display = 'inline-block';
        }

        // 清空对话区域
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }

        // 重置对话历史
        this.conversationHistory = [];
        this.messageHistory = [];

        // 显示故事背景和当前事件
        if (this.storyBackground) {
            this.addMessageToChat('系统', `故事背景：${this.storyBackground}`, null, true);
        }
        if (this.currentEvent) {
            this.addMessageToChat('系统', `当前事件：${this.currentEvent}`, null, true);
            // 让角色对当前事件做出反应
            await this.notifyAgentsOfEvent();
        }

        // 开始对话
        this.startContinuousConversation();
    }

    async startContinuousConversation() {
        while (this.isConversationActive && !this.isPaused) {
            // 让每个角色轮流发言
            for (const agent of this.agents) {
                if (!this.isConversationActive || this.isPaused) break;
                
                try {
                    // 等待一个随机的时间，使对话更自然
                    const waitTime = Math.random() * 2000 + 1000;
                    await this.wait(waitTime);
                    
                    // 生成并显示回复
                    await this.generateAndDisplayResponse(agent);
                    
                    // 随机改变情绪
                    if (Math.random() > 0.7) {
                        const emotion = this.getRandomEmotion();
                        agent.setEmotion(emotion);
                    }
                } catch (error) {
                    console.error(`${agent.name} 响应失败:`, error);
                    this.addMessageToChat(agent.name, '抱歉，我现在无法回应...', agent.avatar, true);
                }
            }
            
            // 在每轮对话后添加一个短暂的停顿
            await this.wait(this.getWaitTime());
        }
    }

    pauseConversation() {
        this.isPaused = true;
        const pauseButton = document.getElementById('pauseConversation');
        const startButton = document.getElementById('startConversation');
        
        if (pauseButton && startButton) {
            pauseButton.style.display = 'none';
            startButton.style.display = 'inline-block';
            startButton.innerHTML = '<i class="fas fa-play"></i> 继续对话';
        }
    }

    resumeConversation() {
        if (this.isConversationActive && this.isPaused) {
            this.isPaused = false;
            const pauseButton = document.getElementById('pauseConversation');
            const startButton = document.getElementById('startConversation');
            
            if (pauseButton && startButton) {
                pauseButton.style.display = 'inline-block';
                startButton.style.display = 'none';
            }
            
            this.startContinuousConversation();
        }
    }

    resetConversation() {
        this.isConversationActive = false;
        this.isPaused = false;
        this.conversationHistory = [];
        this.messageHistory = [];
        
        // 清空对话区域
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }

        // 重置按钮状态
        document.getElementById('startConversation').style.display = 'inline-block';
        document.getElementById('pauseConversation').style.display = 'none';
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        const button = document.getElementById('toggleAutoScroll');
        if (button) {
            button.classList.toggle('active', this.autoScroll);
            if (this.autoScroll) {
                this.scrollToBottom();
            }
        }
    }

    setConversationSpeed(speed) {
        this.conversationSpeed = speed;
        const speedText = this.getSpeedText(speed);
        document.querySelector('.speed-value').textContent = speedText;
    }

    getSpeedText(speed) {
        const speedTexts = {
            1: '很慢',
            2: '慢速',
            3: '正常',
            4: '快速',
            5: '很快'
        };
        return speedTexts[speed] || '正常';
    }

    getWaitTime() {
        const baseTimes = {
            1: 5000,
            2: 3000,
            3: 2000,
            4: 1000,
            5: 500
        };
        return baseTimes[this.conversationSpeed] || 2000;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateAndDisplayResponse(agent) {
        const context = this.getConversationContext();
        const recentMessages = this.getRecentMessages(5);
        const otherAgents = this.agents.filter(a => a.name !== agent.name);
        
        // 构建基础提示词
        let prompt = this.createPromptForAgent(agent);
        
        // 添加对话历史和分析
        if (recentMessages.length > 0) {
            prompt += '\n最近的对话历史：\n';
            recentMessages.forEach((msg, index) => {
                prompt += `${msg.agent || '用户'}: ${msg.content}\n`;
                // 为最后一条消息添加分析建议
                if (index === recentMessages.length - 1) {
                    prompt += `\n对于${msg.agent || '用户'}的这句话：
- 你应该如何回应？
- 这句话暗示了什么？
- 说话者的情绪如何？
- 你应该表达什么态度？\n`;
                }
            });
        }
        
        // 添加其他角色的状态和关系
        if (otherAgents.length > 0) {
            prompt += '\n场景中的其他角色：\n';
            otherAgents.forEach(other => {
                const relationship = agent.relationships.get(other.name) || 50;
                const otherEmotion = AIAgent.emotions[other.currentEmotion];
                prompt += `${other.name}（${other.profile.role}）：
- 你们的关系：${this.getRelationshipLevel(relationship)}
- 当前情绪：${otherEmotion}
- 互动建议：${this.getInteractionSuggestion(relationship, other.currentEmotion)}
- 需要注意：${this.getInteractionNote(relationship, other.currentEmotion)}\n`;
            });
        }
        
        // 添加对话指导
        prompt += `\n回应要求：
1. 要对最近的对话内容做出直接回应
2. 表达要符合你的角色性格
3. 要体现与其他角色的关系
4. 可以表达对当前事件的看法
5. 要展现当前的情绪状态

请基于以上信息，生成一个符合角色设定、有连贯性的回应。`;
        
        // 显示输入中状态
        const typingMessage = this.createTypingMessage(agent);
        
        try {
            const response = await this.api.generateResponse(prompt, context);
            typingMessage.remove();
            
            // 更新对话历史
            this.conversationHistory.push({
                isUser: false,
                agent: agent.name,
                content: response,
                emotion: agent.currentEmotion,
                timestamp: new Date().getTime()
            });
            
            // 处理情绪和关系变化
            this.handleEmotionAndRelationshipChanges(agent, otherAgents, response);
            
            // 显示消息
            this.displayMessage(agent, response);
            
            // 触发其他角色的反应
            await this.triggerReactions(agent, response, otherAgents);
            
        } catch (error) {
            console.error('生成回应时出错:', error);
            typingMessage.remove();
            this.displayErrorMessage(agent);
        }
    }

    handleEmotionAndRelationshipChanges(agent, otherAgents, response) {
        // 根据回复内容分析情绪变化
        const emotionChange = this.analyzeEmotionFromResponse(response);
        if (emotionChange) {
            agent.setEmotion(emotionChange);
        }
        
        // 更新与其他角色的关系
        otherAgents.forEach(other => {
            const currentRelationship = agent.relationships.get(other.name) || 50;
            const relationshipChange = this.calculateRelationshipChange(
                response,
                agent.currentEmotion,
                other.currentEmotion,
                currentRelationship
            );
            
            if (relationshipChange !== 0) {
                const newRelationship = Math.max(0, Math.min(100, currentRelationship + relationshipChange));
                agent.relationships.set(other.name, newRelationship);
                other.relationships.set(agent.name, newRelationship);
                this.displayRelationshipChange(agent, other, currentRelationship, newRelationship);
            }
        });
    }

    analyzeEmotionFromResponse(response) {
        // 根据回复内容判断情绪
        const emotions = {
            happy: ['哈哈', '开心', '太好了', '棒', '喜欢'],
            angry: ['生气', '讨厌', '烦死了', '可恶'],
            sad: ['难过', '伤心', '可惜', '唉'],
            surprised: ['哇', '天啊', '真的吗', '不会吧'],
            worried: ['担心', '害怕', '不知道'],
            calm: ['好的', '明白', '理解', '嗯']
        };
        
        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(keyword => response.includes(keyword))) {
                return emotion;
            }
        }
        return null;
    }

    calculateRelationshipChange(response, speakerEmotion, listenerEmotion, currentRelationship) {
        let change = 0;
        
        // 基于情绪匹配度
        const emotionMatch = this.checkEmotionMatch(speakerEmotion, listenerEmotion);
        change += emotionMatch ? 2 : -1;
        
        // 基于回复内容的友好度
        const friendlyWords = ['谢谢', '请', '帮助', '支持', '理解'];
        const unfriendlyWords = ['滚', '笨', '讨厌', '闭嘴'];
        
        friendlyWords.forEach(word => {
            if (response.includes(word)) change += 1;
        });
        
        unfriendlyWords.forEach(word => {
            if (response.includes(word)) change -= 2;
        });
        
        // 根据当前关系水平调整变化度
        if (currentRelationship > 80 || currentRelationship < 20) {
            change = change * 0.5; // 极端关系下变化较小
        }
        
        return Math.round(change);
    }

    checkEmotionMatch(emotion1, emotion2) {
        const positiveEmotions = ['happy', 'calm'];
        const negativeEmotions = ['angry', 'sad', 'worried'];
        
        return (
            (positiveEmotions.includes(emotion1) && positiveEmotions.includes(emotion2)) ||
            (negativeEmotions.includes(emotion1) && negativeEmotions.includes(emotion2))
        );
    }

    getInteractionSuggestion(relationship, emotion) {
        if (relationship > 80) {
            return emotion === 'happy' ? '可以分享快乐，加深感情' :
                   emotion === 'sad' ? '需要给予真诚的安慰和支持' :
                   '保持亲密互动';
        } else if (relationship > 50) {
            return emotion === 'angry' ? '要帮助平复情绪，表示理解' :
                   emotion === 'worried' ? '要认真倾听并给予建议' :
                   '保持友好交流';
        } else {
            return emotion === 'happy' ? '保持礼貌的祝福' :
                   emotion === 'sad' ? '表达基本的同情' :
                   '避免刺激，��持距离';
        }
    }

    updateRelationships(agent, otherAgents) {
        otherAgents.forEach(other => {
            if (Math.random() > 0.8) {
                const currentRelationship = agent.relationships.get(other.name) || 50;
                const change = Math.floor(Math.random() * 10) - 5; // -5到5的随机变化
                const newRelationship = Math.max(0, Math.min(100, currentRelationship + change));
                
                // 如果关系有变化，显示变化信息
                if (newRelationship !== currentRelationship) {
                    agent.relationships.set(other.name, newRelationship);
                    other.relationships.set(agent.name, newRelationship);
                    this.displayRelationshipChange(agent, other, currentRelationship, newRelationship);
                }
            }
        });
    }

    async triggerReactions(speaker, message, otherAgents) {
        // 随机选择是否要其他角色做出反应
        const shouldReact = Math.random() > 0.7;
        if (!shouldReact) return;
        
        // 随机选择一个角色做出反应
        const reactor = otherAgents[Math.floor(Math.random() * otherAgents.length)];
        if (!reactor) return;
        
        // 构建反应提示
        const relationship = reactor.relationships.get(speaker.name) || 50;
        const reactionPrompt = `
作为${reactor.name}，你听到${speaker.name}说："${message}"
你们的关系是${this.getRelationshipLevel(relationship)}
请用一句话做出简短的回应（不超过15字）`;
        
        try {
            // 添加短暂延迟使对话更自然
            await this.wait(1000);
            
            const reaction = await this.api.generateResponse(reactionPrompt, []);
            this.displayMessage(reactor, reaction);
            
            // 更新对话历史
            this.conversationHistory.push({
                isUser: false,
                agent: reactor.name,
                content: reaction,
                timestamp: new Date().getTime()
            });
        } catch (error) {
            console.error('生成反应失败:', error);
        }
    }

    getRelationshipLevel(value) {
        if (value > 80) return '非常亲密';
        if (value > 60) return '友好';
        if (value > 40) return '一般';
        if (value > 20) return '疏远';
        return '冷淡';
    }

    createTypingMessage(agent) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message typing';
        messageElement.innerHTML = `
            <img src="${agent.avatar}" class="message-avatar">
            <div class="message-content">
                <div class="sender-name">${agent.name}</div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.appendChild(messageElement);
            this.scrollToBottom();
        }
        
        return messageElement;
    }

    displayErrorMessage(agent) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message error';
        messageElement.innerHTML = `
            <img src="${agent.avatar}" class="message-avatar">
            <div class="message-content">
                <span class="agent-name">${agent.name}</span>
                <p>抱歉，生成回应时出现错误</p>
            </div>
        `;
        document.querySelector('.chat-messages').appendChild(messageElement);
        
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    displayMessage(agent, message) {
        const chatContainer = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <img src="${agent.avatar}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="agent-name">${agent.name}</span>
                    <span class="agent-role">${agent.profile.role}</span>
                    <span class="agent-emotion">心情：${AIAgent.emotions[agent.currentEmotion]}</span>
                </div>
                <p class="message-text">${message}</p>
            </div>
        `;
        chatContainer.appendChild(messageElement);
        
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    displayRelationshipChange(agent1, agent2, oldValue, newValue) {
        const changeType = newValue > oldValue ? 'increase' : 'decrease';
        const changeText = this.getRelationshipChangeText(oldValue, newValue);
        
        const messageElement = document.createElement('div');
        messageElement.className = 'relationship-change';
        messageElement.innerHTML = `
            <div class="relationship-info ${changeType}">
                <div class="agents">
                    <img src="${agent1.avatar}" class="relationship-avatar" alt="${agent1.name}">
                    <i class="fas fa-heart"></i>
                    <img src="${agent2.avatar}" class="relationship-avatar" alt="${agent2.name}">
                </div>
                <span>${agent1.name}与${agent2.name}的关系${changeText} (${Math.round(oldValue)} → ${Math.round(newValue)})</span>
            </div>
        `;
        
        document.querySelector('.chat-messages').appendChild(messageElement);
        this.scrollToBottom();
        
        // 更新双方的关系显示
        this.updateSingleRelationship(agent1.name, agent2.name, newValue);
        this.updateSingleRelationship(agent2.name, agent1.name, newValue);
    }

    getRelationshipChangeText(oldValue, newValue) {
        const diff = newValue - oldValue;
        if (Math.abs(diff) >= 20) {
            return diff > 0 ? '显著提升' : '显著降低';
        } else if (Math.abs(diff) >= 10) {
            return diff > 0 ? '有所提升' : '有所降低';
        } else {
            return diff > 0 ? '略微提升' : '略微降低';
        }
    }

    getConversationContext() {
        return this.conversationHistory.slice(-10).map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    async submitAgentForm() {
        const name = document.getElementById('agentName').value;
        const role = document.getElementById('agentRole').value;
        const background = document.getElementById('agentBackground').value;
        const traits = document.getElementById('agentTraits').value;
        const interests = document.getElementById('agentInterests').value;
        const speakingStyle = document.getElementById('agentSpeakingStyle').value;
        const avatar = document.getElementById('agentAvatar').value;
        const humor = document.getElementById('agentHumor').value;
        const creativity = document.getElementById('agentCreativity').value;
        const friendliness = document.getElementById('agentFriendliness').value;
        const seriousness = document.getElementById('agentSeriousness').value;

        if (!name || !role || !background || !traits || !interests || !speakingStyle || !avatar) {
            alert('请填写所有必填字段');
            return;
        }

        const profile = {
            role: role,
            personality: {
                humor: parseInt(humor),
                creativity: parseInt(creativity),
                friendliness: parseInt(friendliness),
                seriousness: parseInt(seriousness)
            },
            background: background,
            traits: traits.split(',').map(t => t.trim()),
            interests: interests.split(',').map(i => i.trim()),
            speakingStyle: speakingStyle
        };

        // 获取当前正在编辑的角色名称（如果有）
        const editingAgentName = document.getElementById('createAgentModal').getAttribute('data-editing-agent');
        const existingAgent = editingAgentName ? this.agents.find(a => a.name === editingAgentName) : null;

        if (existingAgent) {
            // 如果是编辑现有角色，直接更新该角色的属性
            existingAgent.avatar = avatar;
            existingAgent.updateProfile({
                name: name,
                role: role,
                background: background,
                traits: traits.split(',').map(t => t.trim()),
                interests: interests.split(',').map(i => i.trim()),
                speakingStyle: speakingStyle,
                personality: {
                    humor: parseInt(humor),
                    creativity: parseInt(creativity),
                    friendliness: parseInt(friendliness),
                    seriousness: parseInt(seriousness)
                }
            });
        } else {
            // 创建新角色
            const newAgent = new AIAgent(name, role, avatar);
            newAgent.updateProfile(profile);
            this.agents.push(newAgent);
        }

        // 清除编辑状态
        document.getElementById('createAgentModal').removeAttribute('data-editing-agent');
        this.hideCreateAgentModal();
        this.renderAgents();
    }

    initializeAgents() {
        // 清空现有角色
        this.agents = [];
        
        // 添加默认角色
        this.agents.push(new AIAgent('Alice', '幽默作家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'));
        this.agents.push(new AIAgent('Bob', '严肃哲学家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'));
        this.agents.push(new AIAgent('Carol', '热情艺术家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol'));
        
        this.initializeRelationships();
        this.renderAgents();
    }

    initializeRelationships() {
        this.agents.forEach(agent => {
            this.agents.forEach(otherAgent => {
                if (agent !== otherAgent) {
                    agent.relationships.set(otherAgent.name, 50 + Math.random() * 20);
                }
            });
        });
    }

    renderAgents() {
        const container = document.getElementById('agents-container');
        // 保留创建新角色按钮
        const createButton = container.querySelector('#createAgent');
        container.innerHTML = '';
        container.appendChild(createButton);

        this.agents.forEach(agent => {
            const agentCard = document.createElement('div');
            agentCard.className = 'agent-card';
            agentCard.innerHTML = `
                <img src="${agent.avatar}" alt="${agent.name}的头像">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-role">${agent.role}</div>
                <div class="agent-emotion">${AIAgent.emotions[agent.currentEmotion]}</div>
            `;
            agentCard.onclick = () => this.showCreateAgentModal(agent);
            container.appendChild(agentCard);
        });

        // 更新关系展示面板
        this.updateRelationshipsPanel();
    }

    updateRelationshipsPanel() {
        const container = document.getElementById('relationships-container');
        if (!container) return;

        container.innerHTML = '';
        
        this.agents.forEach(agent => {
            const relationshipCard = document.createElement('div');
            relationshipCard.className = 'relationship-card';
            
            let relationshipsHtml = '';
            this.agents.forEach(otherAgent => {
                if (agent.name !== otherAgent.name) {
                    const relationship = agent.relationships.get(otherAgent.name) || 50;
                    const relationshipLevel = this.getRelationshipLevel(relationship);
                    relationshipsHtml += `
                        <div class="relationship-status" data-agent="${agent.name}" data-target="${otherAgent.name}">
                            <img src="${otherAgent.avatar}" class="relationship-avatar" alt="${otherAgent.name}">
                            <div class="relationship-details">
                                <div class="relationship-name">${otherAgent.name}</div>
                                <div class="relationship-bar-container">
                                    <div class="relationship-bar">
                                        <div class="relationship-value" style="width: ${relationship}%"></div>
                                    </div>
                                    <div class="relationship-number">${relationship}</div>
                                </div>
                            </div>
                            <div class="relationship-label">${relationshipLevel}</div>
                        </div>
                    `;
                }
            });

            relationshipCard.innerHTML = `
                <div class="relationship-header">
                    <img src="${agent.avatar}" class="relationship-avatar" alt="${agent.name}">
                    <div class="relationship-details">
                        <div class="relationship-name">${agent.name}</div>
                        <div class="relationship-role">${agent.role}</div>
                    </div>
                </div>
                <div class="relationship-emotion">当前心情：${AIAgent.emotions[agent.currentEmotion]}</div>
                ${relationshipsHtml}
            `;
            
            container.appendChild(relationshipCard);
        });
    }

    // 添加新方法：更新单个关系状态
    updateSingleRelationship(agent1Name, agent2Name, newValue) {
        const relationshipElement = document.querySelector(
            `.relationship-status[data-agent="${agent1Name}"][data-target="${agent2Name}"]`
        );
        
        if (relationshipElement) {
            const valueBar = relationshipElement.querySelector('.relationship-value');
            const numberDisplay = relationshipElement.querySelector('.relationship-number');
            const labelDisplay = relationshipElement.querySelector('.relationship-label');
            
            // 使用动画过渡更新数值和进度条
            valueBar.style.width = `${newValue}%`;
            numberDisplay.textContent = Math.round(newValue);
            labelDisplay.textContent = this.getRelationshipLevel(newValue);
            
            // 添加动画效果
            numberDisplay.classList.add('value-change');
            setTimeout(() => numberDisplay.classList.remove('value-change'), 500);
        }
    }

    getRecentMessages(count = 3) {
        return this.conversationHistory
            .slice(-count)
            .map(msg => ({
                agent: msg.agent,
                content: msg.content,
                timestamp: msg.timestamp
            }));
    }

    getRandomEmotion() {
        const emotions = Object.keys(AIAgent.emotions);
        return emotions[Math.floor(Math.random() * emotions.length)];
    }

    addUserMessage(message) {
        this.conversationHistory.push({
            isUser: true,
            content: message,
            timestamp: new Date().getTime()
        });
    }

    showCreateAgentModal(agentName = null) {
        const modal = document.getElementById('createAgentModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteButton = document.getElementById('deleteAgent');
        const submitButton = document.getElementById('submitAgent');
        const openAvatarSelector = document.getElementById('openAvatarSelector');

        if (!modal) return;

        // 绑定头像选择器事件
        openAvatarSelector.addEventListener('click', () => this.showAvatarSelector());

        // 重置表单
        document.getElementById('agentName').value = '';
        document.getElementById('agentRole').value = '';
        document.getElementById('agentBackground').value = '';
        document.getElementById('agentTraits').value = '';
        document.getElementById('agentInterests').value = '';
        document.getElementById('agentSpeakingStyle').value = '';
        document.getElementById('agentAvatar').value = '';
        document.getElementById('agentHumor').value = '50';
        document.getElementById('agentCreativity').value = '50';
        document.getElementById('agentFriendliness').value = '50';
        document.getElementById('agentSeriousness').value = '50';

        // 更新所有滑块的显示值
        document.querySelectorAll('.slider-value').forEach(span => {
            span.textContent = '50';
        });

        if (agentName) {
            // 编辑现有角色
            const agent = this.agents.find(a => a.name === agentName);
            if (agent) {
                // 设置当前正在编辑的角色名称
                modal.setAttribute('data-editing-agent', agentName);
                
                modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> 编辑角色';
                document.getElementById('agentName').value = agent.name;
                document.getElementById('agentRole').value = agent.profile.role;
                document.getElementById('agentBackground').value = agent.profile.background;
                document.getElementById('agentTraits').value = agent.profile.traits.join(', ');
                document.getElementById('agentInterests').value = agent.profile.interests.join(', ');
                document.getElementById('agentSpeakingStyle').value = agent.profile.speakingStyle;
                document.getElementById('agentAvatar').value = agent.avatar;
                
                // 设置性格滑块
                document.getElementById('agentHumor').value = agent.profile.personality.humor;
                document.getElementById('agentCreativity').value = agent.profile.personality.creativity;
                document.getElementById('agentFriendliness').value = agent.profile.personality.friendliness;
                document.getElementById('agentSeriousness').value = agent.profile.personality.seriousness;

                // 更新块显示值
                document.querySelectorAll('.slider-group').forEach(group => {
                    const slider = group.querySelector('input[type="range"]');
                    const valueDisplay = group.querySelector('.slider-value');
                    if (slider && valueDisplay) {
                        valueDisplay.textContent = slider.value;
                    }
                });

                deleteButton.style.display = 'inline-block';
                submitButton.innerHTML = '<i class="fas fa-save"></i> 更新';
            }
        } else {
            // 创建新角色
            modal.removeAttribute('data-editing-agent');
            modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> 创建新角色';
            deleteButton.style.display = 'none';
            submitButton.innerHTML = '<i class="fas fa-save"></i> 创建';
        }

        modal.style.display = 'block';

        // 添加滑块值更新事件
        document.querySelectorAll('.slider-group').forEach(group => {
            const slider = group.querySelector('input[type="range"]');
            const valueDisplay = group.querySelector('.slider-value');
            if (slider && valueDisplay) {
                slider.addEventListener('input', () => {
                    valueDisplay.textContent = slider.value;
                });
            }
        });
    }

    deleteAgent(agentName) {
        if (confirm(`确定要删除角色 "${agentName}" 吗？`)) {
            this.agents = this.agents.filter(agent => agent.name !== agentName);
            this.hideCreateAgentModal();
            this.renderAgents();
        }
    }

    hideCreateAgentModal() {
        const modal = document.getElementById('createAgentModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setStoryBackground(background) {
        if (!background) return;
        
        this.storyBackground = background;
        const currentBackground = document.getElementById('currentBackground');
        if (currentBackground) {
            currentBackground.textContent = background;
            // 保存到localStorage
            localStorage.setItem('storyBackground', background);
        }
    }

    setCurrentEvent(event) {
        if (!event) return;
        
        this.currentEvent = event;
        const currentEventStatus = document.getElementById('currentEventStatus');
        if (currentEventStatus) {
            currentEventStatus.textContent = event;
            // 保存到localStorage
            localStorage.setItem('currentEvent', event);
        }
    }

    notifyAgentsOfEvent() {
        if (this.currentEvent && this.isConversationActive && !this.isPaused) {
            this.agents.forEach(async (agent) => {
                const response = await this.generateEventResponse(agent);
                if (response) {
                    this.displayMessage(agent, response);
                }
            });
        }
    }

    async generateEventResponse(agent) {
        const context = this.getConversationContext();
        const eventPrompt = `根据你的角色设定：${agent.profile.role}
在故事背景：${this.storyBackground || '（无特定背景）'}下，
对于刚刚发生的事件：${this.currentEvent}，
请以你的角色性格做出回应。记住要始终保持角色性格特征。`;
        
        try {
            return await this.api.generateResponse(eventPrompt, context);
        } catch (error) {
            console.error('生成事件回应时出错:', error);
            return null;
        }
    }

    getRelationshipsDescription() {
        const relationships = [];
        for (const agent of this.agents) {
            for (const [targetName, value] of agent.relationships) {
                let relationshipLevel;
                if (value > 80) relationshipLevel = '非常亲密';
                else if (value > 60) relationshipLevel = '友好';
                else if (value > 40) relationshipLevel = '一般';
                else if (value > 20) relationshipLevel = '疏远';
                else relationshipLevel = '淡';
                relationships.push(`与${targetName}的关系：${relationshipLevel}`);
            }
        }
        return relationships.join('；');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    showAvatarSelector() {
        const modal = document.getElementById('avatarSelectorModal');
        const avatarGrid = document.getElementById('avatarGrid');
        
        // 生成头像选项
        const seeds = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo'];
        const styles = ['avataaars', 'bottts', 'initials', 'micah', 'personas'];
        
        avatarGrid.innerHTML = '';
        styles.forEach(style => {
            seeds.forEach(seed => {
                const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
                const div = document.createElement('div');
                div.className = 'avatar-option';
                div.innerHTML = `<img src="${avatarUrl}" alt="${style} ${seed}">`;
                
                div.addEventListener('click', () => {
                    // 更新选中态
                    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                    div.classList.add('selected');
                    
                    // 更新预览和隐藏输入框
                    document.getElementById('selectedAvatarPreview').src = avatarUrl;
                    document.getElementById('agentAvatar').value = avatarUrl;
                    
                    // 关闭选择器
                    this.hideAvatarSelector();
                });
                
                avatarGrid.appendChild(div);
            });
        });
        
        modal.style.display = 'block';
    }

    hideAvatarSelector() {
        const modal = document.getElementById('avatarSelectorModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    getInteractionNote(relationship, emotion) {
        if (relationship > 80) {
            switch(emotion) {
                case 'happy': return '可以分享快乐，加深感情';
                case 'sad': return '需要给予真诚的安慰和支持';
                case 'angry': return '要帮助平复情绪，表示理解';
                case 'worried': return '要认真倾听并给予建议';
                default: return '保持亲密互动';
            }
        } else if (relationship > 50) {
            switch(emotion) {
                case 'happy': return '可以适当分享喜悦';
                case 'sad': return '表达适度的关心';
                case 'angry': return '保持适当距离，注意措辞';
                case 'worried': return '可以提供一些建议';
                default: return '保持友好交流';
            }
        } else {
            switch(emotion) {
                case 'happy': return '保持礼貌的祝福';
                case 'sad': return '表达基本的同情';
                case 'angry': return '避免刺激，保持距离';
                case 'worried': return '给予一般性建议';
                default: return '保持基本礼貌';
            }
        }
    }
}

window.aiChat = new AIChat();

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const submitButton = document.getElementById('submitApiKey');
    const errorMessage = document.getElementById('apiKeyError');

    function validateApiKey(apiKey) {
        return apiKey && apiKey.trim().length > 0;
    }

    submitButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!validateApiKey(apiKey)) {
            errorMessage.textContent = 'API密钥不能为空';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            await window.aiChat.initializeAPI(apiKey);
            localStorage.setItem('apiKey', apiKey);

            // 初始化控制按钮
            const controls = document.querySelector('.controls');
            if (controls) {
                controls.innerHTML = `
                    <button id="startConversation" class="primary-btn">
                        <i class="fas fa-play"></i> 开始对话
                    </button>
                    <button id="pauseConversation" class="secondary-btn style="display: none;">
                        <i class="fas fa-pause"></i> 暂停对话
                    </button>
                    <button id="resetConversation" class="secondary-btn">
                        <i class="fas fa-redo"></i> 重置对话
                    </button>
                    <button id="toggleAutoScroll" class="secondary-btn active">
                        <i class="fas fa-scroll"></i> 自动滚动
                    </button>
                    <button id="createAgent" class="primary-btn">
                        <i class="fas fa-user-plus"></i> 创建角色
                    </button>
                    <div class="speed-control">
                        <label><i class="fas fa-tachometer-alt"></i> 对话速度</label>
                        <input type="range" id="conversationSpeed" min="1" max="5" value="3">
                        <span class="speed-value">正常</span>
                    </div>
                `;

                // 添加事件监听器
                document.getElementById('startConversation').addEventListener('click', () => {
                    window.aiChat.startConversation();
                });

                document.getElementById('resetConversation').addEventListener('click', () => {
                    window.aiChat.resetConversation();
                });

                document.getElementById('createAgent').addEventListener('click', () => {
                    window.aiChat.showCreateAgentModal();
                });

                const pauseButton = document.getElementById('pauseConversation');
                if (pauseButton) {
                    pauseButton.addEventListener('click', () => {
                        if (pauseButton.innerHTML.includes('暂停')) {
                            window.aiChat.pauseConversation();
                        } else {
                            window.aiChat.resumeConversation();
                        }
                    });
                }

                const autoScrollButton = document.getElementById('toggleAutoScroll');
                if (autoScrollButton) {
                    autoScrollButton.addEventListener('click', () => {
                        window.aiChat.toggleAutoScroll();
                    });
                }

                const speedSelect = document.getElementById('conversationSpeed');
                if (speedSelect) {
                    speedSelect.addEventListener('change', (e) => {
                        window.aiChat.setConversationSpeed(parseInt(e.target.value));
                    });
                }
            }

            // 加载存的故事景和当前事件
            const savedBackground = localStorage.getItem('storyBackground');
            const savedEvent = localStorage.getItem('currentEvent');
            
            if (savedBackground) {
                document.getElementById('storyBackground').value = savedBackground;
                window.aiChat.setStoryBackground(savedBackground);
            }
            
            if (savedEvent) {
                document.getElementById('currentEvent').value = savedEvent;
                window.aiChat.setCurrentEvent(savedEvent);
            }
            
            // 添加更新按钮的事件监听
            const updateBackgroundBtn = document.getElementById('updateBackground');
            if (updateBackgroundBtn) {
                updateBackgroundBtn.addEventListener('click', () => {
                    const background = document.getElementById('storyBackground').value;
                    window.aiChat.setStoryBackground(background);
                });
            }
            
            const updateEventBtn = document.getElementById('updateEvent');
            if (updateEventBtn) {
                updateEventBtn.addEventListener('click', () => {
                    const event = document.getElementById('currentEvent').value;
                    window.aiChat.setCurrentEvent(event);
                });
            }
        } catch (error) {
            console.error('初始化失败:', error);
            errorMessage.textContent = '初始化失败，请检查API密钥是否正确';
            errorMessage.style.display = 'block';
        }
    });

    // 加载保存的API密钥
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
});
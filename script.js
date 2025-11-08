<script>
    const CW_GET_STATUS_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1301363e02e34cc791d4e75ea400b36d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iN2sh3VqqQDA4KVwtI6TpV0RXhk2_Y_9jSoIuXSMvWQ';
    const CW_SEND_MESSAGE_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed4ddce5ddf4559a5497db276691a0f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=87e8kgVWhgNLRtVkiU2-YJvdHE6UkX0wPgANY8FZ8_Y';
    const CW_GET_CHATS_URL = 'https://default6bceeacf48244b408c6dfa6e15ddc6.d9.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2334eb9a0d1d4d2386d56277e107c33a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=2SGpKNNezwf-U1wiEpNYNU2CQI1ggzJB6k0nZO0YiFo';
    
    let cwIsLive = false;
    let cwConversationId = cwGenerateId();
    let cwUserInfo = null;
    let cwChatStarted = false;
    let cwPollingInterval = null;
    let cwLastMessageCount = 0;
    
    function cwGenerateId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async function cwCheckChatStatus() {
        try {
            const response = await fetch(CW_GET_STATUS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkStatus: true })
            });
            
            const data = await response.json();
            cwIsLive = data.isLive;
            
            const statusText = document.getElementById('cw-chat-status');
            if (cwIsLive) {
                statusText.textContent = '🟢 Brett is available';
                // Start polling for replies when in live mode
                if (cwChatStarted && !cwPollingInterval) {
                    cwStartPolling();
                }
            } else {
                statusText.textContent = '🤖 AI Assistant';
                // Stop polling in AI mode
                cwStopPolling();
            }
            
            return cwIsLive;
        } catch (error) {
            console.error('Error checking chat status:', error);
            return false;
        }
    }
    
    function cwToggleChat() {
        const chatWindow = document.getElementById('cw-chat-window');
        chatWindow.classList.toggle('open');
        
        if (chatWindow.classList.contains('open') && !cwChatStarted) {
            cwCheckChatStatus().then(() => {
                cwShowContactForm();
            });
        } else if (!chatWindow.classList.contains('open')) {
            // Stop polling when chat is closed
            cwStopPolling();
        }
    }
    
    function cwShowContactForm() {
        const messagesDiv = document.getElementById('cw-chat-messages');
        
        const formHTML = `
            <div class="cw-contact-form">
                <div class="cw-form-header">
                    <h4>Let's get started!</h4>
                    <p>Please share your contact information</p>
                </div>
                <form id="cw-contact-form" onsubmit="cwSubmitContactForm(event)">
                    <input type="text" id="cw-firstName" placeholder="First Name*" required>
                    <input type="text" id="cw-lastName" placeholder="Last Name*" required>
                    <input type="email" id="cw-email" placeholder="Email*" required>
                    <input type="tel" id="cw-phone" placeholder="Phone*" required>
                    <button type="submit" class="cw-form-submit">Start Chat</button>
                </form>
            </div>
        `;
        
        messagesDiv.innerHTML = formHTML;
    }
    
    function cwSubmitContactForm(event) {
        event.preventDefault();
        
        cwUserInfo = {
            firstName: document.getElementById('cw-firstName').value.trim(),
            lastName: document.getElementById('cw-lastName').value.trim(),
            email: document.getElementById('cw-email').value.trim(),
            phone: document.getElementById('cw-phone').value.trim()
        };
        
        cwChatStarted = true;
        
        // Clear form and show welcome message
        document.getElementById('cw-chat-messages').innerHTML = '';
        cwShowWelcomeMessage();
        
        // Start polling if in live mode
        if (cwIsLive) {
            cwStartPolling();
        }
    }
    
    function cwShowWelcomeMessage() {
        const welcomeMsg = cwIsLive 
            ? `Hi ${cwUserInfo.firstName}! Brett here. How can I help you today?`
            : `Hi ${cwUserInfo.firstName}! I'm the Clausewell AI assistant. I can answer basic questions about our services. For specific legal matters, I'll connect you with Brett directly.`;
        
        cwAddMessage('bot', welcomeMsg);
        cwLastMessageCount = 1; // Welcome message counts as first message
    }
    
    function cwAddMessage(sender, text) {
        const messagesDiv = document.getElementById('cw-chat-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `cw-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'cw-message-avatar';
        avatar.textContent = sender === 'bot' ? (cwIsLive ? '👤' : '🤖') : (sender === 'brett' ? '👤' : '👤');
        
        const bubble = document.createElement('div');
        bubble.className = 'cw-message-bubble';
        bubble.textContent = text;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        messagesDiv.appendChild(messageDiv);
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    function cwShowTyping() {
        const messagesDiv = document.getElementById('cw-chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'cw-message bot';
        typingDiv.innerHTML = `
            <div class="cw-message-avatar">${cwIsLive ? '👤' : '🤖'}</div>
            <div class="cw-typing-indicator active">
                <span></span><span></span><span></span>
            </div>
        `;
        typingDiv.id = 'cw-typing-indicator';
        messagesDiv.appendChild(typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    function cwHideTyping() {
        const typing = document.getElementById('cw-typing-indicator');
        if (typing) typing.remove();
    }
    
    async function cwSendMessage(event) {
        event.preventDefault();
        
        if (!cwChatStarted || !cwUserInfo) {
            return;
        }
        
        const input = document.getElementById('cw-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        cwAddMessage('user', message);
        input.value = '';
        
        const sendButton = document.getElementById('cw-chat-send');
        sendButton.disabled = true;
        input.disabled = true;
        
        cwShowTyping();
        
        try {
            // Check current status RIGHT BEFORE sending message
            await cwCheckChatStatus();
            
            // Now send message with current isLive value
            const response = await fetch(CW_SEND_MESSAGE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    conversationId: cwConversationId,
                    isLive: cwIsLive,
                    firstName: cwUserInfo.firstName,
                    lastName: cwUserInfo.lastName,
                    email: cwUserInfo.email,
                    phone: cwUserInfo.phone
                })
            });
            
            const data = await response.json();
            
            cwHideTyping();
            cwAddMessage('bot', data.reply);
            cwLastMessageCount += 2; // User message + bot reply
            
        } catch (error) {
            console.error('Error sending message:', error);
            cwHideTyping();
            cwAddMessage('bot', 'Sorry, there was an error. Please try again or email brett@clausewell.com');
        } finally {
            sendButton.disabled = false;
            input.disabled = false;
            input.focus();
        }
    }
    
    // Polling functions for live replies
    function cwStartPolling() {
        if (cwPollingInterval) return; // Already polling
        
        cwPollingInterval = setInterval(cwCheckForNewMessages, 3000); // Check every 3 seconds
    }
    
    function cwStopPolling() {
        if (cwPollingInterval) {
            clearInterval(cwPollingInterval);
            cwPollingInterval = null;
        }
    }
    
    async function cwCheckForNewMessages() {
        if (!cwChatStarted || !cwIsLive) return;
        
        try {
            const response = await fetch(CW_GET_CHATS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    conversationId: cwConversationId 
                })
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            
            // Check if there are new messages
            if (data.messages && data.messages.length > cwLastMessageCount) {
                // Get only the new messages
                const newMessages = data.messages.slice(cwLastMessageCount);
                
                // Add new messages to chat
                newMessages.forEach(msg => {
                    if (msg.sender === 'brett') {
                        cwAddMessage('brett', msg.text);
                    }
                });
                
                cwLastMessageCount = data.messages.length;
            }
            
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }
    
    // Check status every 60 seconds
    setInterval(cwCheckChatStatus, 60000);
</script>

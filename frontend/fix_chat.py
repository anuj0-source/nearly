import re

with open('c:/Users/anuj6/OneDrive/Desktop/nearly/frontend/src/pages/Chat.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# History block
history_pattern = r'''(                            \{item\.sender === "them" && \(\n                                <div style=\{\{\n                                    width: 32, height: 32, borderRadius: "50%",\n                                    overflow: "hidden", flexShrink: 0,\n                                    background: "var\(--accent-dim\)",\n                                    display: "grid", placeItems: "center"\n                                \}\}>\n                                    \{partnerAvatar\n                                        \? <img src=\{partnerAvatar\} alt=\{partnerName\} style=\{\{ width: "100%", height: "100%", objectFit: "cover" \}\} />\n                                        : <span style=\{\{ fontFamily: "var\(--brand\)", fontSize: 11, fontWeight: 700, color: "var\(--accent\)" \}\}>\n                                            \{partnerName\.split\(" "\)\.map\(w => w\[0\]\)\.join\(""\)\.substring\(0, 2\)\.toUpperCase\(\)\}\n                                          </span>\n                                    \}\n                                </div>\n                            \}\)\n\n                            \{item\.sender === "me" && \(\n                                <button \n                                    className="msg-context-btn" \n                                    onClick=\{\(e\) => handleContextMenu\(e, item\.id, item\.sender === "me"\)\}\n                                    aria-label="More options"\n                                    title="More options"\n                                >\n                                    <ChevronDown size=\{16\} />\n                                </button>\n                            \}\)\n\n                            <div className="swipe-reply-icon" style=\{\{ opacity: 0, transform: 'scale\(0\.5\)', position: 'absolute', color: 'var\(--text-primary\)', pointerEvents: 'none', transition: 'all 0\.2s cubic-bezier\(0\.16, 1, 0\.3, 1\)' \}\}>\n                                <Reply size=\{20\} />\n                            </div>\n\n                            <div \n                                className=\{\ubble \$\{isEmojiOnly\(item\.text\) \? 'emoji-only' : ''\}\\}\n                                onContextMenu=\{\(e\) => handleContextMenu\(e, item\.id, item\.sender === "me"\)\}\n                                onTouchStart=\{\(e\) => handleTouchStart\(e, item\.id, item\.sender === "me"\)\}\n                                onTouchEnd=\{handleTouchEnd\}\n                                onTouchMove=\{handleTouchMove\}\n                            >)'''

history_replacement = '''                            {item.sender === "me" && (
                                <button 
                                    className="msg-context-btn" 
                                    onClick={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                    aria-label="More options"
                                    title="More options"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}

                            <div className="swipe-reply-icon" style={{ opacity: 0, transform: 'scale(0.5)', position: 'absolute', color: 'var(--text-primary)', pointerEvents: 'none', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <Reply size={20} />
                            </div>

                            <div 
                                className="message-swipe-wrapper"
                                style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}
                                onTouchStart={(e) => handleTouchStart(e, item.id, item.sender === "me")}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                            >
                                {item.sender === "them" && (
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        overflow: "hidden", flexShrink: 0,
                                        background: "var(--accent-dim)",
                                        display: "grid", placeItems: "center"
                                    }}>
                                        {partnerAvatar
                                            ? <img src={partnerAvatar} alt={partnerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : <span style={{ fontFamily: "var(--brand)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                                                {partnerName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                              </span>
                                        }
                                    </div>
                                )}

                                <div 
                                    className={ubble }
                                    onContextMenu={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                >'''

content = re.sub(history_pattern, history_replacement, content)

live_pattern = r'''(                            \{item\.sender === "them" && \(\n\n                                <AnonymousAvatar\n                                    type=\{match\.avatar\}\n                                    size="md"\n                                />\n\n                            \}\)\n\n\n                            \{item\.sender === "me" && \(\n                                <button \n                                    className="msg-context-btn" \n                                    onClick=\{\(e\) => handleContextMenu\(e, item\.id, item\.sender === "me"\)\}\n                                    aria-label="More options"\n                                    title="More options"\n                                >\n                                    <ChevronDown size=\{16\} />\n                                </button>\n                            \}\)\n\n                            <div className="swipe-reply-icon" style=\{\{ opacity: 0, transform: 'scale\(0\.5\)', position: 'absolute', color: 'var\(--text-primary\)', pointerEvents: 'none', transition: 'all 0\.2s cubic-bezier\(0\.16, 1, 0\.3, 1\)' \}\}>\n                                <Reply size=\{20\} />\n                            </div>\n\n                            <div \n                                className=\{\ubble \$\{isEmojiOnly\(item\.text\) \? 'emoji-only' : ''\}\\}\n                                onContextMenu=\{\(e\) => handleContextMenu\(e, item\.id, item\.sender === "me"\)\}\n                                onTouchStart=\{\(e\) => handleTouchStart\(e, item\.id, item\.sender === "me"\)\}\n                                onTouchEnd=\{handleTouchEnd\}\n                                onTouchMove=\{handleTouchMove\}\n                            >)'''

live_replacement = '''                            {item.sender === "me" && (
                                <button 
                                    className="msg-context-btn" 
                                    onClick={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                    aria-label="More options"
                                    title="More options"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            )}

                            <div className="swipe-reply-icon" style={{ opacity: 0, transform: 'scale(0.5)', position: 'absolute', color: 'var(--text-primary)', pointerEvents: 'none', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <Reply size={20} />
                            </div>

                            <div 
                                className="message-swipe-wrapper"
                                style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}
                                onTouchStart={(e) => handleTouchStart(e, item.id, item.sender === "me")}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                            >
                                {item.sender === "them" && (

                                    <AnonymousAvatar
                                        type={match.avatar}
                                        size="md"
                                    />

                                )}

                                <div 
                                    className={ubble }
                                    onContextMenu={(e) => handleContextMenu(e, item.id, item.sender === "me")}
                                >'''

content = re.sub(live_pattern, live_replacement, content)

# Close tags for both
# Note: we need to replace the closing tags only where appropriate.
# Since both structures end with:
#                                 </small>
#                             </div>
#                             {item.sender === "them" && (
# So we can just replace that exact string
close_pattern = r'''(                                </small>\n\n                            </div>\n\n                            \{item\.sender === "them" && \()'''
close_replacement = '''                                </small>
                                </div>
                            </div>

                            {item.sender === "them" && ('''
content = re.sub(close_pattern, close_replacement, content)

with open('c:/Users/anuj6/OneDrive/Desktop/nearly/frontend/src/pages/Chat.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

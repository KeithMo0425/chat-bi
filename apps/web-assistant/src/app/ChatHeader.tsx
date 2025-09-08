// import { PlusOutlined } from "@ant-design/icons";
// import { Button, Space } from "antd";


// export const ChatHeader = () => {
//   return (
//     <div className={styles.chatHeader}>
//     <div className={styles.headerTitle}>✨ AI Copilot</div>
//     <Space size={0}>
//       <Button
//         type="text"
//         icon={<PlusOutlined />}
//         onClick={() => {
//           if (messages?.length) {
//             const timeNow = dayjs().valueOf().toString();
//             abortController.current?.abort();
//             // The abort execution will trigger an asynchronous requestFallback, which may lead to timing issues.
//             // In future versions, the sessionId capability will be added to resolve this problem.
//             setTimeout(() => {
//               setSessionList([
//                 { key: timeNow, label: 'New session', group: 'Today' },
//                 ...sessionList,
//               ]);
//               setCurSession(timeNow);
//               // setMessages([]);
//             }, 100);
//           } else {
//             message.error('It is now a new conversation.');
//           }
//         }}
//         className={styles.headerButton}
//       />
//       <Popover
//         placement="bottom"
//         styles={{ body: { padding: 0, maxHeight: 600 } }}
//         content={
//           <Conversations
//             items={sessionList?.map((i) =>
//               i.key === curSession ? { ...i, label: `[current] ${i.label}` } : i,
//             )}
//             activeKey={curSession}
//             groupable
//             onActiveChange={async (val) => {
//               abortController.current?.abort();
//               // The abort execution will trigger an asynchronous requestFallback, which may lead to timing issues.
//               // In future versions, the sessionId capability will be added to resolve this problem.
//               setTimeout(() => {
//                 setCurSession(val);
//                 // setMessages(messageHistory?.[val] || []);
//               }, 100);
//             }}
//             styles={{ item: { padding: '0 8px' } }}
//             className={styles.conversations}
//           />
//         }
//       >
//         <Button type="text" icon={<CommentOutlined />} className={styles.headerButton} />
//       </Popover>
//       <Button
//         type="text"
//         icon={<CloseOutlined />}
//         onClick={() => setCopilotOpen(false)}
//         className={styles.headerButton}
//       />
//     </Space>
//   </div>
//   )
// }
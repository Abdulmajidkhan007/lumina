// Contracts (interfaces + input types)
export type {
  AuthSession,
  IAuthApi,
  AddCommentInput,
  IPostsApi,
  IStoriesApi,
  IReelsApi,
  IUsersApi,
  SendMessageInput,
  IMessagesApi,
  INotificationsApi,
} from './contracts';

// Bound singletons (typed as interfaces)
export {
  authApi,
  postsApi,
  storiesApi,
  reelsApi,
  usersApi,
  messagesApi,
  notificationsApi,
} from './client';

// Socket.IO event names (constants to avoid typos)

// Client -> Server events
export const CLIENT_EVENTS = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  START_GAME: 'start_game',
  PLAY_CARD: 'play_card',
  DRAW_CARD: 'draw_card',
  CALL_UNO: 'call_uno',
  CHALLENGE_UNO: 'challenge_uno',
  CHOOSE_PLAYER: 'choose_player',
  RECONNECT_PLAYER: 'reconnect_player',
  HEARTBEAT: 'heartbeat',
  CREATE_ALLIANCE: 'create_alliance', // Add alliance events
  JOIN_ALLIANCE: 'join_alliance',
  LEAVE_ALLIANCE: 'leave_alliance',
  SEND_CHAT_MESSAGE: 'send_chat_message', // Chat event
  PASS_TURN: 'pass_turn', // Pass turn after drawing a playable card
} as const;

// Server -> Client events
export const SERVER_EVENTS = {
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTING: 'game_starting',
  GAME_STARTED: 'game_started',
  GAME_STATE_SYNC: 'game_state_sync',
  TURN_CHANGED: 'turn_changed',
  CARD_PLAYED: 'card_played',
  CARD_DRAWN: 'card_drawn',
  PENALTY_APPLIED: 'penalty_applied',
  HAND_SWAPPED: 'hands_swapped',
  HANDS_PASSED: 'hands_passed',
  PLAYER_ELIMINATED: 'player_eliminated',
  ROUND_ENDED: 'round_ended',
  GAME_ENDED: 'game_ended',
  CHOOSE_PLAYER_PROMPT: 'choose_player_prompt',
  CHOOSE_COLOR_PROMPT: 'choose_color_prompt',
  UNO_CALLED: 'uno_called',
  UNO_CHALLENGE_FAILED: 'uno_challenge_failed',
  UNO_CHALLENGE_SUCCEEDED: 'uno_challenge_succeeded',
  ERROR: 'error',
  INVALID_ACTION: 'invalid_action',
  PLAYER_RECONNECTED: 'player_reconnected',
  PLAYER_DISCONNECTED: 'player_disconnected',
  ALLIANCE_CREATED: 'alliance_created', // Add alliance events
  ALLIANCE_UPDATED: 'alliance_updated',
  ALLIANCE_ERROR: 'alliance_error',
  CHAT_MESSAGE: 'chat_message', // Chat event
} as const;

export type ClientEventName = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
export type ServerEventName = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

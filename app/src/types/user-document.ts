// Automerge document shape for a user's personal schedule data

export interface UserDocument {
  /** Set of bookmarked slot IDs */
  bookmarks: number[]
  /** When true, sessions whose end time has already passed are hidden */
  hidePastEvents: boolean
}

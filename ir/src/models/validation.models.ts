export interface Validation {
  date: Date;
  sentenceId: string;
  requestId: string,
  validation: number
}

export class VoteCount {

  get positive() { return this.positiveKnownInstance + this.positiveUnknownInstance }
  get negative() { return this.negativeKnownInstance + this.negativeUnknownInstance }
  get average() { return (this.positive - this.negative) / (this.positive + this.negative) || 0 }
  get averageKnownInstance() { return (this.positiveKnownInstance - this.negativeKnownInstance) / (this.positiveKnownInstance + this.negativeKnownInstance) || 0 }
  get averageUnknownInstance() { return (this.positiveUnknownInstance - this.negativeUnknownInstance) / (this.positiveUnknownInstance + this.negativeUnknownInstance) || 0 }

  positiveKnownInstance: number = 0;
  negativeKnownInstance: number = 0;

  positiveUnknownInstance: number = 0;
  negativeUnknownInstance: number = 0;

  public addScore(score: number, known: boolean) {
      if (score > 0 && known)
          this.positiveKnownInstance += score;
      else if (score < 0 && known)
          this.negativeKnownInstance += -score;
      else if (score > 0 && !known)
          this.positiveUnknownInstance += score;
      else if (score < 0 && !known)
          this.negativeUnknownInstance += -score;
  }
}
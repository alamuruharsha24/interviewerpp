export class APIKeyManager {
  private apiKeys: string[] = [
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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'
  ];

  private failedKeys: Set<string> = new Set();
  private currentKeyIndex: number = 0;

  constructor() {
    console.log(`🔑 API Key Manager initialized with ${this.apiKeys.length} keys`);
  }

  getCurrentKey(): string {
    // Find next working key
    while (this.currentKeyIndex < this.apiKeys.length) {
      const key = this.apiKeys[this.currentKeyIndex];
      if (!this.failedKeys.has(key)) {
        console.log(`🔐 Using API key #${this.currentKeyIndex + 1}`);
        return key;
      }
      this.currentKeyIndex++;
    }

    // If all keys failed, reset and try again (in case failures were temporary)
    if (this.failedKeys.size === this.apiKeys.length) {
      console.log('⚠️ All API keys failed, resetting and trying again...');
      this.failedKeys.clear();
      this.currentKeyIndex = 0;
      return this.apiKeys[0];
    }

    throw new Error('No working API keys available');
  }

  markKeyAsFailed(apiKey: string): void {
    console.log(`❌ Marking API key as failed: ${apiKey.substring(0, 20)}...`);
    this.failedKeys.add(apiKey);
    
    // Move to next key
    this.currentKeyIndex++;
    
    console.log(`📊 Failed keys: ${this.failedKeys.size}/${this.apiKeys.length}`);
  }

  getWorkingKeysCount(): number {
    return this.apiKeys.length - this.failedKeys.size;
  }

  resetFailedKeys(): void {
    console.log('🔄 Resetting all failed keys');
    this.failedKeys.clear();
    this.currentKeyIndex = 0;
  }

  getStats(): { total: number; working: number; failed: number } {
    return {
      total: this.apiKeys.length,
      working: this.getWorkingKeysCount(),
      failed: this.failedKeys.size
    };
  }
}

// Create singleton instance
export const apiKeyManager = new APIKeyManager();
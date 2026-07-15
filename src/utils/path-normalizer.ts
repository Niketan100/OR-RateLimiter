export class PathNormalizer {
  match(requestPath: string, pattern: string): boolean {
    // Convert Express-style pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')           // Wildcard
      .replace(/:(\w+)/g, '([^/]+)')  // Named params
      .replace(/\//g, '\\/');         // Escape slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(requestPath);
  }
}
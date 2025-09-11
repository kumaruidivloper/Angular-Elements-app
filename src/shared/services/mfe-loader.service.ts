import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MfeLoaderService {
  private loaded = new Set<string>();

  loadScript(name: string, url: string): Promise<void> {
    if (this.loaded.has(name)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';
      script.onload = () => {
        this.loaded.add(name);
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }
}

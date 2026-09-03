import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Link } from './link.model';
import { LinksService } from './links.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  url = signal('');
  links = signal<Link[]>([]);
  submitting = signal(false);
  loadError = signal('');
  formError = signal('');
  lastCreated = signal<Link | null>(null);

  constructor(private linksService: LinksService) {
    this.loadLinks();
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async loadLinks(): Promise<void> {
    this.loadError.set('');
    try {
      const links = await this.linksService.getLinks();
      this.links.set(links);
    } catch (err) {
      this.loadError.set(err instanceof Error ? err.message : 'Failed to load links');
    }
  }

  async onSubmit(): Promise<void> {
    this.formError.set('');
    this.lastCreated.set(null);
    const value = this.url().trim();

    if (!this.isValidHttpUrl(value)) {
      this.formError.set('Please enter a valid http:// or https:// URL');
      return;
    }

    this.submitting.set(true);
    try {
      const link = await this.linksService.createLink(value);
      this.lastCreated.set(link);
      this.url.set('');
      await this.loadLinks();
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      this.submitting.set(false);
    }
  }
}

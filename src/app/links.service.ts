import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Link } from './link.model';

const API_BASE = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class LinksService {
  constructor(private http: HttpClient) {}

  getLinks(): Promise<Link[]> {
    return firstValueFrom(this.http.get<Link[]>(`${API_BASE}/api/links`));
  }

  async createLink(url: string): Promise<Link> {
    try {
      return await firstValueFrom(
        this.http.post<Link>(`${API_BASE}/api/links`, { url })
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const message = err.error?.error || err.message || 'Request failed';
        throw new Error(message);
      }
      throw err;
    }
  }
}

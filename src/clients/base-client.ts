// Base HTTP client for Qubic API services

import type { QubicApiError, RpcStatus } from "../types/common.ts";

/**
 * Configuration options for the base client
 */
export interface ClientConfig {
  /** Base URL for the API */
  baseUrl: string;
  /** Additional headers to include in requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom fetch implementation (useful for testing or Node.js environments) */
  fetchFn?: typeof fetch;
}

/**
 * Base client class with common HTTP methods and error handling
 */
export class BaseClient {
  protected baseUrl: string;
  protected headers: Record<string, string>;
  protected timeout: number;
  protected fetchFn: typeof fetch;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };
    this.timeout = config.timeout ?? 30000; // Default 30 seconds
    this.fetchFn = config.fetchFn ?? fetch;
  }

  /**
   * Create a QubicApiError from various error types
   */
  protected createError(
    message: string,
    status?: number,
    details?: any
  ): QubicApiError {
    const error = new Error(message) as QubicApiError;
    error.name = "QubicApiError";
    error.status = status;
    error.details = details;
    return error;
  }

  /**
   * Handle API error responses
   */
  protected async handleErrorResponse(response: Response): Promise<never> {
    let errorData: RpcStatus | undefined;

    try {
      const text = await response.text();
      if (text) {
        errorData = JSON.parse(text) as RpcStatus;
      }
    } catch {
      // Ignore JSON parse errors
    }

    const message =
      errorData?.message ||
      `HTTP ${response.status}: ${response.statusText}`;

    throw this.createError(message, response.status, errorData?.details);
  }

  /**
   * Make a GET request
   */
  protected async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url.toString(), {
        method: "GET",
        headers: this.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw this.createError(
            `Request timeout after ${this.timeout}ms`,
            408
          );
        }
        if ((error as QubicApiError).status) {
          throw error; // Re-throw API errors
        }
      }

      throw this.createError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        0
      );
    }
  }

  /**
   * Make a POST request
   */
  protected async post<T, R = T>(path: string, body?: R): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url.toString(), {
        method: "POST",
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw this.createError(
            `Request timeout after ${this.timeout}ms`,
            408
          );
        }
        if ((error as QubicApiError).status) {
          throw error; // Re-throw API errors
        }
      }

      throw this.createError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
        0
      );
    }
  }

  /**
   * Update base URL
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Update headers
   */
  public setHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * Update timeout
   */
  public setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
}

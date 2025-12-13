import { Logger } from '../utils/Logger';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const logger = new Logger('AssetOptimizationService');

// CDN configuration
interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  assetPath: string;
}

/**
 * Service for optimizing asset delivery and CDN integration
 */
class AssetOptimizationService {
  private cdnConfig: CDNConfig;
  private assetCache: Map<string, { hash: string, cdnUrl: string }>;
  private isDevelopment: boolean;
  
  constructor() {
    // Determine environment
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Initialize asset cache
    this.assetCache = new Map();
    
    // Configure CDN settings
    this.cdnConfig = {
      // CDN is enabled only in production by default
      enabled: process.env.CDN_ENABLED === 'true' || (!this.isDevelopment && process.env.CDN_ENABLED !== 'false'),
      
      // CDN base URL, falls back to relative path if not configured
      baseUrl: process.env.CDN_BASE_URL || '',
      
      // Path to assets directory in the CDN
      assetPath: process.env.CDN_ASSET_PATH || 'assets'
    };
    
    // Log configuration
    logger.info('Asset optimization service initialized', {
      cdnEnabled: this.cdnConfig.enabled,
      environment: this.isDevelopment ? 'development' : 'production'
    });
  }
  
  /**
   * Get the URL for an asset, optimized for delivery
   * In production, this will return a CDN URL if CDN is enabled
   * In development, it returns the local URL
   * 
   * @param assetPath Path to the asset relative to the public directory
   * @returns Optimized URL for the asset
   */
  getAssetUrl(assetPath: string): string {
    // Normalize path
    const normalizedPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
    
    // Check if we have this asset cached
    if (this.assetCache.has(normalizedPath)) {
      const { cdnUrl } = this.assetCache.get(normalizedPath)!;
      return cdnUrl;
    }
    
    // In development or if CDN is disabled, use local path
    if (this.isDevelopment || !this.cdnConfig.enabled) {
      return `/${normalizedPath}`;
    }
    
    // In production with CDN, generate CDN URL with hash for cache busting
    try {
      // Attempt to get the file path in the public directory
      const filePath = path.join(process.cwd(), 'public', normalizedPath);
      
      // Generate a content hash for the file for cache busting
      const fileContent = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileContent).digest('hex').substring(0, 8);
      
      // Generate CDN URL
      const cdnUrl = this.cdnConfig.baseUrl
        ? `${this.cdnConfig.baseUrl}/${this.cdnConfig.assetPath}/${normalizedPath}?v=${hash}`
        : `/${normalizedPath}?v=${hash}`;
      
      // Cache the result
      this.assetCache.set(normalizedPath, { hash, cdnUrl });
      
      return cdnUrl;
    } catch (error) {
      // If there's an error (e.g. file not found), log and return the local path
      logger.warn('Error generating CDN URL', {
        assetPath: normalizedPath,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return `/${normalizedPath}`;
    }
  }
  
  /**
   * Get information about all assets in the public directory
   * Useful for generating asset manifests or preloading hints
   */
  getAssetManifest(directory: string = ''): Record<string, { path: string, url: string, size: number, hash: string }> {
    const manifest: Record<string, { path: string, url: string, size: number, hash: string }> = {};
    const baseDir = path.join(process.cwd(), 'public', directory);
    
    try {
      // Recursively scan the directory
      this.scanDirectory(baseDir, baseDir, manifest);
      return manifest;
    } catch (error) {
      logger.error('Error generating asset manifest', {
        directory,
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }
  
  /**
   * Recursively scan a directory to build the asset manifest
   */
  private scanDirectory(
    baseDir: string,
    currentDir: string,
    manifest: Record<string, { path: string, url: string, size: number, hash: string }>
  ): void {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        this.scanDirectory(baseDir, filePath, manifest);
      } else {
        // Calculate the relative path from the base directory
        const relativePath = path.relative(baseDir, filePath);
        // Replace backslashes with forward slashes for URLs (Windows compatibility)
        const normalizedPath = relativePath.replace(/\\/g, '/');
        
        // Get file size
        const size = stat.size;
        
        // Generate hash for the file
        const fileContent = fs.readFileSync(filePath);
        const hash = crypto.createHash('md5').update(fileContent).digest('hex');
        
        // Get the optimized URL for the asset
        const url = this.getAssetUrl(path.join(path.relative(path.join(process.cwd(), 'public'), baseDir), normalizedPath));
        
        // Add to manifest
        manifest[normalizedPath] = {
          path: normalizedPath,
          url,
          size,
          hash
        };
      }
    }
  }
  
  /**
   * Generate HTML for preloading critical assets
   * @param assetPaths Array of asset paths to preload
   * @returns HTML string with preload links
   */
  generatePreloadTags(assetPaths: string[]): string {
    return assetPaths.map(assetPath => {
      const url = this.getAssetUrl(assetPath);
      const ext = path.extname(assetPath).toLowerCase();
      
      // Determine resource type based on extension
      let as = 'fetch';
      if (['.js', '.mjs', '.jsx', '.ts', '.tsx'].includes(ext)) {
        as = 'script';
      } else if (['.css'].includes(ext)) {
        as = 'style';
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'].includes(ext)) {
        as = 'image';
      } else if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) {
        as = 'font';
      }
      
      return `<link rel="preload" href="${url}" as="${as}" ${as === 'font' ? 'crossorigin="anonymous"' : ''}>`;
    }).join('\n');
  }
  
  /**
   * Clear the asset cache to force re-generation of URLs
   */
  clearCache(): void {
    this.assetCache.clear();
    logger.info('Asset cache cleared');
  }
}

export const assetOptimizationService = new AssetOptimizationService();
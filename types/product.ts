export type ProductStatus = 'concept' | 'prototype' | 'production';
export type ProductCategory = 'audio' | 'control' | 'iot' | 'power';

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  category: ProductCategory;

  specifications: Specification[];
  bom: BOMComponent[];
  images: ProductImages;
  documentation: Documentation;
  repositories: Repositories;
  diagrams?: Diagrams;

  createdAt: string;
  updatedAt: string;
}

export interface Specification {
  label: string;
  value: string;
  unit?: string;
}

export interface BOMComponent {
  id: string;
  quantity: number;
  reference: string;
  value: string;
  package?: string;
  manufacturer?: string;
  partNumber?: string;
  notes?: string;
  datasheet?: string;
}

export interface ProductImages {
  hero: string;
  gallery: string[];
  renders?: string[];
  schematics?: string[];
}

export interface Documentation {
  userManual?: string;
  technicalSpecs?: string;
  assemblyGuide?: string;
}

export interface Repositories {
  hardware?: string;
  firmware?: string;
  mechanical?: string;
}

export interface Diagrams {
  block?: string; // Mermaid code
  schematic?: string; // Image URL
  assembly?: string; // Mermaid or image
}

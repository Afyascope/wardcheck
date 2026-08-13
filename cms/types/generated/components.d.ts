import type { Schema, Struct } from '@strapi/strapi';

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Reusable SEO metadata for editorial content.';
    displayName: 'SEO';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    ogDescription: Schema.Attribute.Text;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String;
    seoDescription: Schema.Attribute.Text;
    seoKeywords: Schema.Attribute.String;
    seoTitle: Schema.Attribute.String;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'A labelled social profile URL for an author.';
    displayName: 'Social Link';
  };
  attributes: {
    label: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
    }
  }
}

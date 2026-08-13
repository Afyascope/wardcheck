import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const cloudinaryName = env('CLOUDINARY_NAME');

  const security = {
    allowedTypes: allowedMediaTypes,
    deniedTypes: deniedExecutableTypes,
  };

  const uploadConfig: Core.Config.Plugin['upload'] = {
    config: {},
  };

  if (cloudinaryName) {
    uploadConfig.config = {
      security,
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: cloudinaryName,
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    };
  } else {
    uploadConfig.config = {
      security,
    };
  }

  return {
    'users-permissions': {
      config: {
        jwtManagement: 'refresh',
        sessions: {
          httpOnly: true,
        },
      },
    },
    upload: uploadConfig,
  };
};

export default config;

const PUBLIC_READ_ACTIONS = [
  'api::article.article.find',
  'api::article.article.findOne',
  'api::salary-guide.salary-guide.find',
  'api::salary-guide.salary-guide.findOne',
  'api::career-guide.career-guide.find',
  'api::career-guide.career-guide.findOne',
  'api::workplace-guide.workplace-guide.find',
  'api::workplace-guide.workplace-guide.findOne',
  'api::author.author.find',
  'api::author.author.findOne',
  'api::category.category.find',
  'api::category.category.findOne',
  'api::tag.tag.find',
  'api::tag.tag.findOne',
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Ensures the Public role can read published editorial content through the REST API.
   *
   * The WardCheck public website reads published articles and guides directly from this
   * CMS (https://cms.wardcheck.co.ke). Only `find` / `findOne` are granted - no write or
   * admin access is ever exposed to the public.
   *
   * This is idempotent: permissions that already exist are left untouched.
   */
  async bootstrap({ strapi }: { strapi: import('@strapi/strapi').Core.Strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findMany({ where: { role: publicRole.id } });

    const existingActions = new Set(existing.map((permission) => permission.action));

    for (const action of PUBLIC_READ_ACTIONS) {
      if (!existingActions.has(action)) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: publicRole.id },
        });
      }
    }
  },
};

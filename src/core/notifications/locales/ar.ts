/**
 * Arabic translations for notifications
 * ترجمات عربية للإشعارات
 */

function flattenTranslations(
  obj: Record<string, any>,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[newKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenTranslations(value, newKey));
    }
  }

  return result;
}

export const arNested = {
  messages: {
    email: {
      auth: {
        logout: {
          subject: "تم تسجيل خروجك - {{userName}}",
        },
        welcome: {
          subject: "مرحباً بك في تطبيقنا!",
        },
        password_reset: {
          subject: "إعادة تعيين كلمة المرور",
        },
        password_changed: {
          subject: "تم تغيير كلمة المرور",
        },
        new_device: {
          subject: "تنبيه تسجيل دخول من جهاز جديد",
        },
        account_status: {
          subject: "تحديث حالة الحساب",
        },
      },
      shipment: {
        new_request: {
          subject: "طلب شحن جديد رقم {{id}}",
        },
      },
      order: {
        placed: {
          subject: "تأكيد الطلب - الطلب رقم {{orderId}}",
        },
        confirmed: {
          subject: "تم تأكيد الطلب رقم {{orderId}}",
        },
        shipped: {
          subject: "تم شحن طلبك رقم {{orderId}}",
        },
        delivered: {
          subject: "تم تسليم طلبك رقم {{orderId}}",
        },
        cancelled: {
          subject: "تم إلغاء الطلب رقم {{orderId}}",
        },
        payment_received: {
          subject: "تأكيد الدفع - الطلب رقم {{orderId}}",
        },
      },
    },
    push_notification: {
      auth: {
        logout: {
          title: "تم تسجيل الخروج",
          message: "تم تسجيل خروجك بنجاح يا {{userName}}. نراك قريباً!",
        },
        welcome: {
          title: "مرحباً بك!",
          message: "مرحباً بك في تطبيقنا يا {{userName}}! نحن سعداء بانضمامك إلينا.",
        },
        password_reset: {
          title: "طلب إعادة تعيين كلمة المرور",
          message: "تم استلام طلبك لإعادة تعيين كلمة المرور. يرجى التحقق من بريدك الإلكتروني.",
        },
        password_changed: {
          title: "تم تغيير كلمة المرور",
          message: "تم تغيير كلمة المرور الخاصة بك بنجاح",
        },
        new_device: {
          title: "تم اكتشاف تسجيل دخول من جهاز جديد",
          message: "تم اكتشاف تسجيل دخول من جهاز جديد على حسابك",
        },
        account_status: {
          title: "تم تغيير حالة الحساب",
          message: "تم تغيير حالة حسابك إلى {{status}}",
        },
      },
      shipment: {
        new_request: {
          title: "طلب شحن جديد",
          message: "تم طلب الشحنة رقم {{id}}",
        },
      },
      order: {
        placed: {
          title: "تم تقديم الطلب بنجاح",
          message: "تم تقديم طلبك رقم {{orderId}} بنجاح",
        },
        confirmed: {
          title: "تم تأكيد الطلب",
          message: "تم تأكيد طلبك رقم {{orderId}} وجاري معالجته",
        },
        shipped: {
          title: "تم شحن الطلب",
          message: "تم شحن طلبك رقم {{orderId}}",
        },
        delivered: {
          title: "تم تسليم الطلب",
          message: "تم تسليم طلبك رقم {{orderId}} بنجاح",
        },
        cancelled: {
          title: "تم إلغاء الطلب",
          message: "تم إلغاء طلبك رقم {{orderId}}",
        },
        payment_received: {
          title: "تم استلام الدفعة",
          message: "تم استلام دفعة بقيمة ${{amount}} للطلب رقم {{orderId}}",
        },
      },
      system: {
        maintenance: {
          title: "صيانة مجدولة",
          message: "صيانة النظام مجدولة في {{startTime}}. المدة المتوقعة: {{duration}}",
        },
        app_update: {
          title: "تحديث متوفر",
          message: "الإصدار {{version}} متاح الآن للتنزيل",
        },
        announcement: {
          title: "إعلان",
          message: "{{announcementText}}",
        },
      },
    },
  },
  common: {
    hello: "مرحباً",
    thank_you: "شكراً لك",
    regards: "مع أطيب التحيات",
    team: "الفريق",
    view_details: "عرض التفاصيل",
  },
};


// Export flattened version for the translation system
export const ar = flattenTranslations(arNested);

export type TranslationKeys = keyof typeof ar;

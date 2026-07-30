import admin from 'firebase-admin';
import * as adminApp from 'firebase-admin/app';

console.log("admin:", Object.keys(admin || {}));
console.log("admin.credential:", admin?.credential);
console.log("adminApp:", Object.keys(adminApp || {}));

## Plugin for Capacitor RFID

Verification of the RFID plugin for Capacitor

```
npm ls capacitor-plugin-rfid
```

If not installed, install it:

```
npm install capacitor-plugin-rfid
```

Build and sync the project:

```
npm run build
npx cap sync
```

<br>

## Working in local plugin

If you need to work in local plugin, you can use the following command:

In the project plugin folder generate link:

```
npm link
```

In the project where you want to use the plugin, install the plugin:

```
npm link capacitor-plugin-rfid
npm install
```

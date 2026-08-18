export function getAccessibilitySetupSteps(manufacturer?: string, brand?: string): string[] {
  const m = `${manufacturer ?? ''} ${brand ?? ''}`.toLowerCase();

  if (m.includes('oneplus') || m.includes('oppo') || m.includes('realme')) {
    return [
      'Tap Open settings below',
      'Scroll to Installed services or Downloaded apps',
      'Tap KidNest App Blocking (or KidNest)',
      'Turn the switch ON and tap Allow',
      'Come back here and pull down to refresh',
    ];
  }

  if (m.includes('samsung')) {
    return [
      'Tap Open settings below',
      'Go to Installed apps',
      'Find and tap KidNest',
      'Turn ON and confirm',
    ];
  }

  if (m.includes('xiaomi') || m.includes('redmi') || m.includes('poco')) {
    return [
      'Tap Open settings below',
      'Go to Downloaded apps / Installed services',
      'Tap KidNest and turn it ON',
      'Confirm on the popup',
    ];
  }

  return [
    'Tap Open settings below',
    'Find Installed services or Downloaded apps',
    'Tap KidNest and turn it ON',
    'Confirm the permission prompt',
  ];
}

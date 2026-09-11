export function getProfileBanner(gender?: string | null): string {
  if (gender === 'male') {
    return '/assets/male-elderly-newspaper-banner.jpg';
  }
  // Hardcode default to female/Kamla
  return '/assets/morning_banner.jpg'; 
}

export function getProfileBannerAltText(gender?: string | null): string {
  if (gender === 'male') {
    return 'Elderly man reading a newspaper on a peaceful mountain terrace.';
  }
  return 'Elderly woman looking at a serene morning mountain view with tea.';
}

export function getProfileAvatar(gender?: string | null): string | null {
  if (gender === 'male') {
    return '/assets/male-elderly-avatar.jpg';
  }
  return '/assets/kamla_avatar.jpg';
}

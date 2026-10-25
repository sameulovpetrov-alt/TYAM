import { useAvatarEditor } from "../components/AvatarEditor";
import { useSettings } from "../store";

export function useProfileAvatarEditor() {
  const open = useAvatarEditor();
  const { settings, update, toast } = useSettings();
  return () => open({
    kind: "profile",
    name: settings.displayName,
    image: settings.avatarUrl,
    source: settings.avatarSource,
    crop: settings.avatarCrop,
    onSave: ({ url, source, crop }) => {
      update({ avatarUrl: url, avatarSource: source, avatarCrop: crop });
      toast("Аватар сохранён", "success");
    },
  });
}
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const runtime = process.env.MODVAULT_FEEDBACK_TEST_RUNTIME ?? join(process.env.TEMP, "modvault-feedback-tests");
const runtimeRequire = createRequire(join(runtime, "package.json"));
const React = runtimeRequire("react");
const { act, create } = runtimeRequire("react-test-renderer");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const id = "00000000-0000-0000-0000-000000000012";
const calls = [];
let signedIn = true;
const subscriptions = new Map();
let activeCreatorId = null;
let canPublish = true;
let uploadOptions;
const handleWrites = [];
const profileWrites = [];
const uploads = [];
const supabase = {
  from: table => ({ update: patch => ({ eq: (field, value) => ({ select: () => ({ maybeSingle: async () => {
    profileWrites.push({ table, patch, field, value });
    return { data: { username: "fixture-user" } };
  } }) }) }) }),
  storage: { from: bucket => ({
    upload: async (path, file, options) => { uploads.push({ bucket, path, file, options }); return {}; },
    getPublicUrl: path => ({ data: { publicUrl: "https://example.test/" + path } }),
  }) },
  auth: {
    getUser: async () => ({ data: { user: signedIn ? { id } : null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  rpc: async (name, args) => {
    calls.push({ name, args });
    if (name === "get_personal_handle") return { data: "fixture-user" };
    if (name === "get_creator_handle") return { data: null };
    if (name === "identity_handle_availability") return { data: "available" };
    if (name === "set_identity_handle") { handleWrites.push(args); return { data: args.p_handle.toLowerCase() }; }
    if (name === "write_discussion_recognition") return { data: { active: args.p_action === "award", reason: args.p_reason, canAward: args.p_action === "revoke", canRevoke: args.p_action === "award", recognitionId: args.p_request } };
    if (name === "follow_state") return { data: { following: subscriptions.get(activeCreatorId), identityCreatorId: activeCreatorId, canFollow: true, signedIn } };
    if (name === "set_follow") {
      assert.equal(args.p_expected_creator, activeCreatorId);
      subscriptions.set(activeCreatorId, args.p_follow);
      return { data: args.p_follow };
    }
    if (name === "list_following") return { data: args.p_kind === "creator" ? [
      { id, name: "Fixture creator", image: "/avatar.png", attribution: null, available: true },
    ] : [] };
    if (name === "list_announcements") return { data: { canPublish, items: [] } };
    if (name === "write_announcement") return { data: args.p_id };
    throw new Error("Unexpected RPC " + name);
  },
};
const window = {
  location: { hash: "", search: "" },
  addEventListener() {},
  removeEventListener() {},
};
const link = props => React.createElement("a", props, props.children);
const stub = () => null;
const cache = new Map();

function load(path) {
  if (cache.has(path)) return cache.get(path);
  const exports = {};
  cache.set(path, exports);
  const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const require = name => {
    if (name === "react" || name === "react/jsx-runtime") return runtimeRequire(name);
    if (name === "next/link") return { default: link };
    if (name === "next/navigation") return { useRouter: () => ({ push() {}, refresh() {} }) };
    if (name === "lucide-react") return { Check: stub, Award: stub };
    if (name === "@/app/contexts/CreatorContext") return { useCreatorContext: () => ({ accountId: signedIn ? id : null, activeCreatorId, activeCreator: activeCreatorId ? { name: "Creator identity" } : null }) };
    if (name === "@/lib/supabase/client") return { supabase };
    if (name === "@/lib/profile/fields") return load("lib/profile/fields.ts");
    if (name === "./IdentityHandleEditor") return load("components/profile/IdentityHandleEditor.tsx");
    if (name === "./CreatorVerificationBadge") return { default: stub };
    if (name === "./ProfileFormFields") return load("components/profile/ProfileFormFields.tsx");
    if (name === "./FollowButton") return load("components/following/FollowButton.tsx");
    if (name === "@/lib/forms/defaultModForm") return load("lib/forms/defaultModForm.ts");
    if (name === "@/app/hooks/useUploadCreators") return { default: () => ({}) };
    if (name === "@/app/hooks/useUploadSubmit") return { default: options => {
      uploadOptions = options;
      return {};
    } };
    if (name === "@/components/mod-form/ModFormContainer") return { default: props => props.children };
    if (name === "@/components/mod-form/ModForm") return { default: props => props.publicationOptions };
    if (name.startsWith("@/components/")) return { default: stub };
    throw new Error("Unexpected import " + name);
  };
  vm.runInNewContext(outputText, { exports, require, window, setTimeout, URL, URLSearchParams, crypto: globalThis.crypto, document: {} });
  return exports;
}

let view;
const mount = async (component, props = {}) => {
  await act(async () => { view = create(React.createElement(component, props)); });
};
const unmount = async () => { await act(async () => { view.unmount(); }); };
const text = node => typeof node === "string" ? node : (node.children ?? []).map(text).join("");
const button = label => view.root.findAllByType("button").find(node => text(node).trim() === label);
const click = async node => { await act(async () => { node.props.onClick(); }); };

const FollowButton = load("components/following/FollowButton.tsx").default;
await mount(FollowButton, { kind: "creator", id, className: "original" });
await click(button("Follow Creator"));
assert.equal(button("Following").props["aria-pressed"], true);
assert.equal(button("Following").props.className, "original");
await unmount();
await mount(FollowButton, { kind: "creator", id, className: "original" });
assert.ok(button("Following"), "a refresh reads the persisted follow");
activeCreatorId = "creator-fixture";
await act(async () => { view.update(React.createElement(FollowButton, { kind: "creator", id, className: "original" })); });
assert.ok(button("Follow Creator"), "switching identity reads separate state");
activeCreatorId = null;
await act(async () => { view.update(React.createElement(FollowButton, { kind: "creator", id, className: "original" })); });
assert.ok(button("Following"), "switching back restores the personal state");
await click(button("Following"));
assert.equal(button("Follow Creator").props["aria-pressed"], false);
await unmount();

await mount(FollowButton, { kind: "user", id, className: "original" });
assert.ok(button("Follow User"));
await click(button("Follow User"));
assert.equal(button("Following").props["aria-pressed"], true);
activeCreatorId = "team-fixture";
await act(async () => { view.update(React.createElement(FollowButton, { kind: "user", id, className: "original" })); });
assert.ok(button("Follow User"), "user follows use the selected identity");
activeCreatorId = null;
await act(async () => { view.update(React.createElement(FollowButton, { kind: "user", id, className: "original" })); });
await click(button("Following"));
assert.ok(button("Follow User"));
await unmount();


const FollowingList = load("components/following/FollowingList.tsx").default;
await mount(FollowingList);
assert.match(JSON.stringify(view.toJSON()), /Personal profile/);
assert.ok(view.root.findAllByType("a").some(node => node.props.href === "/creator/" + id));
await click(button("Unfollow"));
assert.equal(view.root.findAllByType("a").length, 0);
await unmount();

const RelationshipStats = load("components/following/RelationshipStats.tsx").default;
await mount(RelationshipStats, { base: "/creator/" + id, counts: { followers: 0, following: 2, followedCreations: 3 } });
const relationshipLinks = view.root.findAllByType("a");
assert.deepEqual(relationshipLinks.map(node => node.props.href), [
  "/creator/" + id + "/following?view=followers",
  "/creator/" + id + "/following?view=creators",
  "/creator/" + id + "/following?view=mods",
]);
assert.deepEqual(relationshipLinks.map(text), ["0Followers", "2Following", "3Followed Creations"]);
await unmount();

const PersonalProfileEditor = load("components/profile/PersonalProfileEditor.tsx").default;
await mount(PersonalProfileEditor, { profile: { id, username: "fixture-user", display_name: "Fixture", avatar_url: null, bio: null }, extended: true });
const field = name => view.root.findAllByType("input").find(node => node.props.name === name);
const files = view.root.findAllByType("input").filter(node => node.props.type === "file");
await act(async () => { files[0].props.onChange({ target: { files: [{ type: "image/svg+xml", size: 20 }], value: "bad" } }); });
assert.equal(uploads.length, 0);
for (const [input, type] of [[files[0], "image/png"], [files[1], "image/webp"]]) {
  await act(async () => { input.props.onChange({ target: { files: [{ type, size: 20 }], value: "image" } }); });
}
assert.equal(uploads.length, 2);
assert.ok(uploads.every(entry => entry.bucket === "profile-images" && entry.path.startsWith(id + "/") && entry.options.upsert === false));
await act(async () => { field("name").props.onChange({ target: { name: "name", value: "Updated person" } }); });
await act(async () => { field("website").props.onChange({ target: { value: "javascript:alert(1)" } }); });
await act(async () => { await view.root.findAllByType("form")[0].props.onSubmit({ preventDefault() {} }); });
assert.equal(profileWrites.length, 0);
await act(async () => { field("website").props.onChange({ target: { value: "https://example.test/" } }); });
await act(async () => { await view.root.findAllByType("form")[0].props.onSubmit({ preventDefault() {} }); });
assert.equal(profileWrites.length, 1);
assert.equal(profileWrites[0].table, "profiles");
assert.equal(profileWrites[0].value, id);
assert.equal(profileWrites[0].patch.display_name, "Updated person");
assert.ok(!("username" in profileWrites[0].patch));
assert.ok(profileWrites[0].patch.avatar_url.endsWith(".png"));
assert.ok(profileWrites[0].patch.banner_url.endsWith(".webp"));
await unmount();

const IdentityHandleEditor = load("components/profile/IdentityHandleEditor.tsx").default;
await mount(IdentityHandleEditor, { creatorId: id });
await act(async () => { view.root.findByType("input").props.onChange({ target: { value: "New-Creator" } }); });
await click(button("Check availability"));
assert.match(JSON.stringify(view.toJSON()), /This handle is available/);
await act(async () => { await view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
assert.equal(handleWrites[0].p_creator, id);
assert.match(JSON.stringify(view.toJSON()), /Saved @new-creator/);
await unmount();

const CreatorHeader = load("components/creator/profile/CreatorHeader.tsx").default;
const longHandle = "a".repeat(32);
for (const profileType of ["USER", "CREATOR", "TEAM"]) {
  await mount(CreatorHeader, { name: "Display name", profileType, handle: longHandle,
    relationshipRow: React.createElement("nav", null, "Following") });
  const handleLine = view.root.findAllByType("p").find(node => text(node) === "@" + longHandle);
  assert.match(handleLine.props.className, /overflow-wrap:anywhere/);
  const serialized = JSON.stringify(view.toJSON());
  assert.ok(serialized.indexOf(longHandle) < serialized.indexOf("Following"));
  await unmount();
}

const DiscussionRecognition = load("components/discussions/DiscussionRecognition.tsx").default;
let recognitionState = { active: false, reason: null, canAward: true, canRevoke: false, recognitionId: null };
const recognitionProps = { modId: id, commentId: id, onChange: state => { recognitionState = state; } };
await mount(DiscussionRecognition, { ...recognitionProps, state: recognitionState });
await click(button("Recognize contribution"));
await act(async () => { view.root.findByType("input").props.onChange({ target: { value: "Clear reproduction notes" } }); });
await act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
assert.equal(recognitionState.active, true);
assert.equal(recognitionState.reason, "Clear reproduction notes");
await act(async () => { view.update(React.createElement(DiscussionRecognition, { ...recognitionProps, state: recognitionState })); });
assert.match(JSON.stringify(view.toJSON()), /Recognized by creator/);
await click(button("Revoke recognition"));
await act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
assert.equal(recognitionState.active, false);
await unmount();

const Announcements = load("components/following/Announcements.tsx").default;
await mount(Announcements, { id });
await click(button("New announcement"));
assert.equal(view.root.findByProps({ type: "checkbox" }).props.checked, false);
await act(async () => { view.root.findByProps({ maxLength: 120 }).props.onChange({ target: { value: "Fixture title" } }); });
await act(async () => { view.root.findByType("textarea").props.onChange({ target: { value: "Fixture body" } }); });
await act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
assert.equal(calls.find(call => call.name === "write_announcement").args.p_notify, false);
await unmount();

window.location.search = "?compose=version";
await mount(Announcements, { id, mod: true });
assert.equal(view.root.findByType("select").props.value, "version");
assert.equal(view.root.findByProps({ type: "checkbox" }).props.checked, false);
await unmount();
canPublish = false;
await mount(Announcements, { id, mod: true });
assert.equal(view.root.findAllByType("form").length, 0);
await unmount();

await mount(load("app/upload/page.tsx").default);
assert.equal(view.root.findByProps({ type: "checkbox" }).props.checked, true);
assert.equal(uploadOptions.notifyFollowers, true);
await act(async () => { view.root.findByProps({ type: "checkbox" }).props.onChange({ target: { checked: false } }); });
assert.equal(uploadOptions.notifyFollowers, false);
await unmount();

signedIn = false;
await mount(FollowButton, { kind: "mod", id, className: "original" });
assert.equal(view.root.findByType("a").props.href, "/login");
await unmount();

console.log("Following UI checks passed: signed-out link, follow toggle and refresh, account list, authorized composer, version handoff, notification defaults, scoped profile saves, and both image uploads.");

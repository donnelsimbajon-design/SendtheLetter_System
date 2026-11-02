import Notes from '../Dashboard/Notes';

/** Separate public discovery route from the owner's private letter library. */
export default function CommunityPage() {
    return <Notes initialTab="public" />;
}

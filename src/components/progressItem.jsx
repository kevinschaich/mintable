import Link from 'next/link';
import Check from './check';

const ProgressItem = props => {
  return (
    <Link href={props.href}>
      <span style={{ opacity: '/' + props.tab === props.href ? 1 : 0.3 }}>
        <Check opacity={props.completed ? 1 : 0} />
        {props.number}. {props.title}
      </span>
    </Link>
  );
};

export default ProgressItem;

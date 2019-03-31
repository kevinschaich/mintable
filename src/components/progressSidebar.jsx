import Link from 'next/link';
import '../style.scss';

const Check = props => {
  const style = { marginRight: '15px', opacity: props.opacity };
  return (
    <svg viewBox='0 0 16 16' width='16' height='16' style={style}>
      <g fill='#fff'>
        <path
          fill='#fff'
          d='M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M7,11.4L3.6,8L5,6.6l2,2l4-4L12.4,6L7,11.4z'
        />
      </g>
    </svg>
  );
};

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

const ProgressSidebar = props => (
  <div className='progress-sidebar'>
    <ProgressItem tab={props.tab} number={1} title='Welcome' href='/' />
    <ProgressItem tab={props.tab} number={2} title='Accounts Setup' href='/accounts' />
    <ProgressItem tab={props.tab} number={3} title='Spreadsheet Setup' href='/sheets' />
    <ProgressItem tab={props.tab} number={4} title='Done!' href='/done' />
  </div>
);

export default ProgressSidebar;

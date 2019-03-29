import Link from 'next/link';
import '../style.scss';

const Check = props => (
  <svg viewBox='0 0 16 16' width='16' height='16' style={{ marginBottom: '2px', marginRight: '10px' }}>
    <g fill={props.color}>
      <path
        fill={props.color}
        d='M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M7,11.4L3.6,8L5,6.6l2,2l4-4L12.4,6L7,11.4z'
      />
    </g>
  </svg>
);

const ProgressItem = props => {
  const defaultColor = '#137CBD';
  const completedColor = '#0F9960';

  const color = props.completed ? completedColor : defaultColor;
  const opacity = props.active ? 1 : 0.3;
  const style = { color, opacity, cursor: "pointer"};

  return (
    <Link href={props.href}>
      <h2 style={style}>
        {props.completed && <Check color={color} />}
        {props.number}. {props.title}
      </h2>
    </Link>
  );
};

const ProgressHeader = () => (
  <div className='progress-header'>
    <ProgressItem completed number={1} title='Welcome' href='/' />
    <ProgressItem active number={2} title='Accounts Setup' href='/accounts' />
    <ProgressItem completed number={3} title='Spreadsheet Setup' href='/sheets' />
    <ProgressItem number={4} title='Done!' href='/done' />
  </div>
);

export default ProgressHeader;
